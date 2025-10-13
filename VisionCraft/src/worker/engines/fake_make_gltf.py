# Minimal GLTF generator (fallback/demo). Produces a single triangle.
import base64
import json
import struct

def make_demo_gltf() -> bytes:
    # 3 vertices (x,y,z) float32
    positions = [
        0.0, 0.5, 0.0,
       -0.5,-0.5, 0.0,
        0.5,-0.5, 0.0
    ]
    pos_bytes = b"".join(struct.pack("<f", v) for v in positions)
    # indices (uint16)
    indices = [0, 1, 2]
    idx_bytes = b"".join(struct.pack("<H", i) for i in indices)

    buffer_bytes = pos_bytes + idx_bytes
    uri = "data:application/octet-stream;base64," + base64.b64encode(buffer_bytes).decode("ascii")

    pos_len = len(pos_bytes)
    idx_len = len(idx_bytes)

    gltf = {
        "asset": {"version": "2.0", "generator": "VisionCraft Fake Engine"},
        "buffers": [{"uri": uri, "byteLength": len(buffer_bytes)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0,       "byteLength": pos_len, "target": 34962},  # ARRAY_BUFFER
            {"buffer": 0, "byteOffset": pos_len, "byteLength": idx_len, "target": 34963},  # ELEMENT_ARRAY_BUFFER
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3",
             "min": [-0.5, -0.5, 0.0], "max": [0.5, 0.5, 0.0]},
            {"bufferView": 1, "componentType": 5123, "count": 3, "type": "SCALAR"}
        ],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1}]}],
        "nodes": [{"mesh": 0}],
        "scenes": [{"nodes": [0]}],
        "scene": 0
    }
    return json.dumps(gltf).encode("utf-8")
