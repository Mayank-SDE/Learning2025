import json, os, io, time, tempfile, subprocess, shutil, glob, pathlib
import pika, requests, numpy as np
from minio import Minio

RABBIT_URL = os.getenv('RABBIT_URL', 'amqp://rabbitmq:5672')
QUEUE = os.getenv('RABBIT_QUEUE', 'visioncraft.jobs')
SERVER_URL = os.getenv('PUBLIC_BASE_URL', 'http://server:8089')

MINIO = Minio(
    os.getenv('MINIO_ENDPOINT', 'minio'),
    access_key=os.getenv('MINIO_ROOT_USER', 'admin'),
    secret_key=os.getenv('MINIO_ROOT_PASSWORD', 'admin123'),
    secure=os.getenv('MINIO_USE_SSL','false') == 'true',
)
BUCKET = os.getenv('MINIO_BUCKET', 'visioncraft')

def emit_progress(job_id, stage, pct, overall, msg=''):
    try:
        requests.post(f"{SERVER_URL}/v1/jobs/{job_id}/progress",
                      json={'stage': stage, 'pct': pct, 'overall': overall, 'message': msg},
                      timeout=5)
    except Exception as e:
        print('progress err:', e)

# ---------- helpers ----------
def list_project_uploads(project_id: str):
    prefix = f"projects/{project_id}/uploads/"
    objs = MINIO.list_objects(BUCKET, prefix=prefix, recursive=True)
    return [o.object_name for o in objs]

def download_to_dir(keys, dest):
    os.makedirs(dest, exist_ok=True)
    paths = []
    for k in keys:
        p = os.path.join(dest, os.path.basename(k))
        MINIO.fget_object(BUCKET, k, p)
        paths.append(p)
    return paths

def upload_file(local_path, key):
    MINIO.fput_object(BUCKET, key, local_path, content_type='model/gltf-binary' if local_path.endswith('.glb') else None)
    return key

# ---------- photogrammetry (Meshroom) ----------
def run_meshroom(images_dir: str, out_dir: str):
    cmd = [
        "/usr/local/bin/Meshroom.AppImage", "meshroom_photogrammetry",
        "--input", images_dir,
        "--output", out_dir,
        "--save", os.path.join(out_dir, "project.mg"),
        "--forceCompute"
    ]
    print("[meshroom] Running:", " ".join(cmd), flush=True)
    subprocess.check_call(cmd)

    candidates = [
        "Texturing/texturedMesh.obj",
        "MeshroomCache/Texturing/*/texturedMesh.obj",
        "Texturing/mesh.obj"
    ]
    for pat in candidates:
        g = glob.glob(os.path.join(out_dir, pat))
        if g:
            print(f"[meshroom] Found mesh: {g[0]}", flush=True)
            return g[0]
    raise RuntimeError("Meshroom output OBJ not found")

def obj_to_glb(obj_path: str, out_glb: str):
    tmp_gltf = out_glb.replace(".glb", ".gltf")
    subprocess.check_call(["obj2gltf", "-i", obj_path, "-o", tmp_gltf])
    subprocess.check_call(["gltf-pipeline", "-i", tmp_gltf, "-o", out_glb, "-b"])
    for f in [tmp_gltf]:
        if os.path.exists(f): os.remove(f)

# ---------- LiDAR (Open3D Poisson) ----------
def lidar_to_glb(inputs: list[str], out_glb: str):
    import open3d as o3d
    import laspy
    import pathlib, numpy as np
    pts = []
    for p in inputs:
        ext = pathlib.Path(p).suffix.lower()
        if ext in [".las", ".laz"]:
            with laspy.open(p) as fh:
                arr = np.vstack((fh.x, fh.y, fh.z)).T
                pts.append(arr)
        elif ext == ".ply":
            pc = o3d.io.read_point_cloud(p)
            pts.append(np.asarray(pc.points))
    if not pts:
        raise RuntimeError("No LiDAR files (.las/.laz/.ply) found")
    P = np.vstack(pts)
    pcd = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(P))
    pcd.estimate_normals()

    mesh, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        pcd, depth=9
    )
    mesh = mesh.remove_duplicated_vertices().remove_degenerate_triangles()
    mesh = mesh.simplify_quadric_decimation(200000)
    o3d.io.write_triangle_mesh(out_glb, mesh, write_triangle_uvs=False)

# ---------- Mixed ----------
def icp_merge(glb_a: str, glb_b: str, out_glb: str):
    import open3d as o3d
    ma = o3d.io.read_triangle_mesh(glb_a); ma.compute_vertex_normals()
    mb = o3d.io.read_triangle_mesh(glb_b); mb.compute_vertex_normals()
    pa = ma.sample_points_uniformly(50000)
    pb = mb.sample_points_uniformly(50000)
    reg = o3d.pipelines.registration.registration_icp(
        pb, pa, 0.2, np.eye(4),
        o3d.pipelines.registration.TransformationEstimationPointToPoint()
    )
    mb_tx = mb.transform(reg.transformation)
    merged = ma + mb_tx
    merged.compute_vertex_normals()
    o3d.io.write_triangle_mesh(out_glb, merged, write_triangle_uvs=False)

# ---------- main job ----------
def handle_job(body):
    job = json.loads(body)
    job_id = job['jobId']; project_id = job['projectId']
    jtype = job.get('type', 'photogrammetry')
    engine = job.get('engine', 'VISIONCRAFT_AI')
    print(f"[job] start id={job_id} type={jtype} engine={engine}", flush=True)
    emit_progress(job_id, f"Start ({engine})", 0, 2, f"{jtype}…")

    keys = list_project_uploads(project_id)
    print(f"[job] found {len(keys)} uploads", flush=True)
    if not keys:
        raise RuntimeError("No uploads found for project")

    with tempfile.TemporaryDirectory() as tmp:
        loc = download_to_dir(keys, os.path.join(tmp, "inputs"))
        out_dir = os.path.join(tmp, "out"); os.makedirs(out_dir, exist_ok=True)

        try:
            if jtype == 'photogrammetry':
                emit_progress(job_id, "Photogrammetry", 5, 15, "Running Meshroom")
                obj = run_meshroom(images_dir=os.path.join(tmp, "inputs"), out_dir=out_dir)

                emit_progress(job_id, "Photogrammetry", 75, 60, "Converting to GLB")
                glb = os.path.join(out_dir, "model.glb")
                obj_to_glb(obj, glb)
                key = f"projects/{project_id}/outputs/model.glb"
                upload_file(glb, key)

            elif jtype == 'lidar':
                emit_progress(job_id, "LiDAR", 15, 40, "Meshing")
                glb = os.path.join(out_dir, "lidar.glb")
                lidar_to_glb(loc, glb)
                key = f"projects/{project_id}/outputs/lidar.glb"
                upload_file(glb, key)

            else:  # mixed
                emit_progress(job_id, "Mixed", 10, 20, "Photogrammetry stage")
                obj = run_meshroom(images_dir=os.path.join(tmp, "inputs"), out_dir=os.path.join(tmp, "meshroom"))
                glb_photo = os.path.join(tmp, "meshroom", "photo.glb")
                obj_to_glb(obj, glb_photo)

                emit_progress(job_id, "Mixed", 55, 60, "LiDAR stage")
                glb_lidar = os.path.join(tmp, "meshroom", "lidar.glb")
                lidar_to_glb(loc, glb_lidar)

                emit_progress(job_id, "Mixed", 80, 85, "Align & merge")
                glb = os.path.join(out_dir, "mixed.glb")
                icp_merge(glb_photo, glb_lidar, glb)
                key = f"projects/{project_id}/outputs/mixed.glb"
                upload_file(glb, key)

        except Exception as e:
            print(f"[job] ERROR: {e}", flush=True)
            emit_progress(job_id, "Error", 100, 100, f"{type(e).__name__}: {e}")

            fused = glob.glob(os.path.join(out_dir, "MeshroomCache", "DepthMapFilter", "*", "fused.ply"))
            if fused:
                print(f"[job] Fallback: uploading point cloud {fused[0]}", flush=True)
                key = f"projects/{project_id}/outputs/fused.ply"
                MINIO.fput_object(BUCKET, key, fused[0], content_type="model/ply")
                requests.post(f"{SERVER_URL}/v1/projects/{project_id}/outputs", json={'key': key})
            else:
                raise

        else:
            requests.post(f"{SERVER_URL}/v1/projects/{project_id}/outputs", json={'key': key})
            emit_progress(job_id, "Done", 100, 100, "Completed")

def main():
    params = pika.URLParameters(RABBIT_URL)

    for i in range(20):
        try:
            connection = pika.BlockingConnection(params)
            break
        except Exception as e:
            print(f"RabbitMQ not ready (try {i+1}/20): {e}", flush=True)
            time.sleep(2)
    else:
        raise RuntimeError("Could not connect to RabbitMQ")

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE, durable=True)

    def cb(ch, method, properties, body):
        try:
            handle_job(body)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print('job failed:', e)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE, on_message_callback=cb)
    print('Worker ready.')
    channel.start_consuming()

if __name__ == '__main__':
    main()
