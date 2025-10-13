<# 
  setup-visioncraft.ps1
  Bootstraps VisionCraft backend: MinIO, RabbitMQ, Node (Fastify) API, Python worker.
  - Creates directory structure
  - Writes all source files
  - Builds & runs with docker compose
#>

$ErrorActionPreference = "Stop"

# -----------------------------
# 0) Root layout
# -----------------------------
$root = (Get-Location).Path
Write-Host "Root: $root" -ForegroundColor Cyan

$dirs = @(
  "server/src/routes",
  "worker/engines"
)

foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path (Join-Path $root $d) | Out-Null
}

# -----------------------------
# 1) .env
# -----------------------------
@"
# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET=visioncraft
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=admin123

# Rabbit
RABBIT_URL=amqp://rabbitmq:5672
RABBIT_QUEUE=visioncraft.jobs

# Server
PORT=8089
PUBLIC_BASE_URL=http://server:8089
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173
"@ | Set-Content -Encoding UTF8 (Join-Path $root ".env")

# -----------------------------
# 2) docker-compose.yml
# -----------------------------
@"
version: "3.8"
services:
  minio:
    image: minio/minio:RELEASE.2024-09-22T00-00-00Z
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    volumes: ["minio-data:/data"]

  createbucket:
    image: minio/mc:RELEASE.2024-09-22T00-00-00Z
    depends_on: [minio]
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 \${MINIO_ROOT_USER} \${MINIO_ROOT_PASSWORD};
      mc mb -p local/visioncraft || true;
      mc policy set public local/visioncraft || true;
      "

  rabbitmq:
    image: rabbitmq:3.13-management
    ports: ["5672:5672", "15672:15672"]

  server:
    build: ./server
    env_file: .env
    depends_on: [minio, rabbitmq, createbucket]
    ports: ["8089:8089"]

  worker:
    build: ./worker
    env_file: .env
    depends_on: [minio, rabbitmq]

volumes:
  minio-data:
"@ | Set-Content -Encoding UTF8 (Join-Path $root "docker-compose.yml")

# -----------------------------
# 3) server/package.json
# -----------------------------
@"
{
  "name": "visioncraft-server",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node --env-file=../.env dist/index.js",
    "build": "tsup src/index.ts --format esm,cjs --splitting false --clean"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/cors": "^10.0.1",
    "@fastify/multipart": "^8.3.0",
    "minio": "^8.0.1",
    "amqplib": "^0.10.4",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "tsup": "^8.1.0",
    "tsx": "^4.19.2",
    "@types/node": "^20.11.0",
    "typescript": "^5.6.3"
  }
}
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\package.json")

# -----------------------------
# 4) server Dockerfile
# -----------------------------
@"
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY src ./src
RUN npx tsx --help >/dev/null 2>&1 || true
CMD ["npm","run","dev"]
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\Dockerfile")

# -----------------------------
# 5) server/src files
# -----------------------------
@"
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { projectsRoutes } from './routes/projects.js'
import { uploadsRoutes } from './routes/uploads.js'
import { jobsRoutes } from './routes/jobs.js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: (process.env.CORS_ORIGIN?.split(',') ?? true) })
await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 1024 } }) // 1GB

await app.register(projectsRoutes, { prefix: '/v1/projects' })
await app.register(uploadsRoutes,  { prefix: '/v1/uploads' })
await app.register(jobsRoutes,     { prefix: '/v1/jobs' })

const port = Number(process.env.PORT ?? 8089)
app.listen({ port, host: '0.0.0.0' })
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\index.ts")

@"
import { Client } from 'minio'
export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER!,
  secretKey: process.env.MINIO_ROOT_PASSWORD!
})
export const BUCKET = process.env.MINIO_BUCKET!
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\minio.ts")

@"
import amqplib from 'amqplib'
const url = process.env.RABBIT_URL!
const queue = process.env.RABBIT_QUEUE!

let conn
let ch
export async function channel() {
  if (!ch) {
    conn = await amqplib.connect(url)
    ch = await conn.createChannel()
    await ch.assertQueue(queue, { durable: true })
  }
  return ch
}
export const QUEUE = queue
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\rabbit.ts")

@"
import { FastifyReply } from 'fastify'
type Listener = (data: any) => void
const listeners = new Map<string, Set<Listener>>()

export function sseSubscribe(jobId: string, reply: FastifyReply) {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  reply.raw.write('\n')
  const set = listeners.get(jobId) ?? new Set<Listener>()
  listeners.set(jobId, set)
  const listener: Listener = (data) => reply.raw.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`)
  set.add(listener)
  reply.raw.on('close', () => set.delete(listener))
}
export function sseEmit(jobId: string, data: any) {
  listeners.get(jobId)?.forEach(fn => fn(data))
}
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\sse.ts")

@"
import { nanoid } from 'nanoid'
import { BUCKET, minio } from '../minio.js'

const projects = new Map<string, any>()

export async function projectsRoutes(app: any) {
  app.post('/', async (req, res) => {
    const body = req.body || {}
    const id = nanoid()
    const project = {
      id, 
      name: body.name ?? 'Untitled',
      description: body.description ?? '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    projects.set(id, project)
    res.send(project)
  })

  app.get('/:id', async (req: any, res: any) => {
    const p = projects.get(req.params.id)
    if (!p) return res.code(404).send({ error: 'not found' })
    // refresh presigned URL if present
    if (p.outputs?.key) {
      p.outputs.modelUrl = await minio.presignedGetObject(BUCKET, p.outputs.key, 60*30)
    }
    res.send(p)
  })

  app.post('/:id/outputs', async (req: any, res: any) => {
    const { key } = req.body || {}
    const p = projects.get(req.params.id)
    if (!p) return res.code(404).send()
    const url = await minio.presignedGetObject(BUCKET, key, 60 * 30)
    p.outputs = { modelUrl: url, key }
    p.status = 'ready'
    p.updatedAt = new Date().toISOString()
    res.send({ ok: true })
  })
}
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\routes\projects.ts")

@"
import { BUCKET, minio } from '../minio.js'

export async function uploadsRoutes(app: any) {
  app.post('/', async (req: any, res: any) => {
    const projectId = req.query.projectId
    const parts = req.parts ? await req.parts() : []
    const saved: string[] = []
    for await (const part of parts) {
      if (part.type === 'file') {
        const key = `projects/\${projectId}/uploads/\${Date.now()}_\${part.filename}`
        await minio.putObject(BUCKET, key, part.file, { 'Content-Type': part.mimetype })
        saved.push(key)
      }
    }
    res.send({ files: saved })
  })
}
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\routes\uploads.ts")

@"
import { channel, QUEUE } from '../rabbit.js'
import { sseSubscribe, sseEmit } from '../sse.js'

export async function jobsRoutes(app: any) {
  app.post('/', async (req: any, res: any) => {
    const { projectId } = req.body || {}
    const jobId = `${projectId}-${Date.now()}`
    const ch = await channel()
    ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ jobId, projectId })), { persistent: true })
    res.send({ jobId })
  })

  app.post('/:id/progress', async (req: any, res: any) => {
    const { stage, pct, overall, message } = req.body || {}
    sseEmit(req.params.id, { stage, pct, overall, message })
    res.send({ ok: true })
  })

  app.get('/:id/stream', async (req: any, reply: any) => {
    sseSubscribe(req.params.id, reply)
  })
}
"@ | Set-Content -Encoding UTF8 (Join-Path $root "server\src\routes\jobs.ts")

# -----------------------------
# 6) worker files
# -----------------------------
@"
minio==7.2.7
pika==1.3.2
requests==2.32.3
numpy==1.26.4
"@ | Set-Content -Encoding UTF8 (Join-Path $root "worker\requirements.txt")

@"
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python","worker.py"]
"@ | Set-Content -Encoding UTF8 (Join-Path $root "worker\Dockerfile")

@"
import json, os, time, io
import pika
import requests
from minio import Minio
from engines.fake_make_gltf import make_demo_gltf

RABBIT_URL = os.getenv('RABBIT_URL', 'amqp://rabbitmq:5672')
QUEUE = os.getenv('RABBIT_QUEUE', 'visioncraft.jobs')
SERVER_URL = os.getenv('PUBLIC_BASE_URL', 'http://server:8089')

minio_client = Minio(
    os.getenv('MINIO_ENDPOINT', 'minio'),
    access_key=os.getenv('MINIO_ROOT_USER', 'admin'),
    secret_key=os.getenv('MINIO_ROOT_PASSWORD', 'admin123'),
    secure=os.getenv('MINIO_USE_SSL','false') == 'true',
)

BUCKET = os.getenv('MINIO_BUCKET', 'visioncraft')

def emit_progress(job_id, stage, pct, overall, message=''):
    try:
        requests.post(f"{SERVER_URL}/v1/jobs/{job_id}/progress",
                      json={'stage': stage, 'pct': pct, 'overall': overall, 'message': message}, timeout=5)
    except Exception as e:
        print('progress err:', e)

def handle_job(body):
    job = json.loads(body)
    job_id = job['jobId']; project_id = job['projectId']
    stages = [('Extracting', 15), ('Matching', 25), ('DenseCloud', 25), ('Meshing', 25), ('Texturing', 10)]
    overall = 0
    for name, weight in stages:
        for i in range(0, 101, 10):
            emit_progress(job_id, name, i, min(100, overall + i*weight/100), f"{name} {i}%")
            time.sleep(0.15)
        overall += weight

    # produce demo glTF
    gltf_bytes = make_demo_gltf()
    key = f"projects/{project_id}/outputs/model.gltf"
    minio_client.put_object(BUCKET, key, io.BytesIO(gltf_bytes), len(gltf_bytes), content_type="model/gltf+json")

    # notify server project output
    requests.post(f"{SERVER_URL}/v1/projects/{project_id}/outputs", json={'key': key})

def main():
    params = pika.URLParameters(RABBIT_URL)
    connection = pika.BlockingConnection(params)
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
"@ | Set-Content -Encoding UTF8 (Join-Path $root "worker\worker.py")

# -----------------------------
# 7) worker/engines/fake_make_gltf.py
#     - Builds a minimal glTF (triangle) with embedded base64 buffer.
# -----------------------------
@"
import base64
import json
def make_demo_gltf() -> bytes:
    # A single triangle, positions only, with indices.
    import struct
    # 3 vertices (x,y,z) float32
    positions = [
        0.0, 0.5, 0.0,
       -0.5,-0.5, 0.0,
        0.5,-0.5, 0.0
    ]
    pos_bytes = b''.join(struct.pack('<f', v) for v in positions)
    # indices (uint16)
    indices = [0,1,2]
    idx_bytes = b''.join(struct.pack('<H', i) for i in indices)

    # Buffer is positions then indices
    buffer_bytes = pos_bytes + idx_bytes
    uri = 'data:application/octet-stream;base64,' + base64.b64encode(buffer_bytes).decode('ascii')

    # Byte offsets
    pos_len = len(pos_bytes)
    idx_len = len(idx_bytes)

    gltf = {
        'asset': {'version': '2.0', 'generator': 'VisionCraft Fake Engine'},
        'buffers': [{'uri': uri, 'byteLength': len(buffer_bytes)}],
        'bufferViews': [
            {'buffer': 0, 'byteOffset': 0,        'byteLength': pos_len, 'target': 34962}, # ARRAY_BUFFER
            {'buffer': 0, 'byteOffset': pos_len,  'byteLength': idx_len, 'target': 34963}, # ELEMENT_ARRAY_BUFFER
        ],
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': 3, 'type': 'VEC3', 'min': [-0.5,-0.5,0.0], 'max':[0.5,0.5,0.0]},
            {'bufferView': 1, 'componentType': 5123, 'count': 3, 'type': 'SCALAR'}
        ],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]}],
        'nodes': [{'mesh': 0}],
        'scenes': [{'nodes': [0]}],
        'scene': 0
    }
    return json.dumps(gltf).encode('utf-8')
"@ | Set-Content -Encoding UTF8 (Join-Path $root "worker\engines\fake_make_gltf.py")

# -----------------------------
# 8) Bring up the stack
# -----------------------------
Write-Host "`nBuilding & starting Docker services..." -ForegroundColor Yellow
docker compose pull | Out-Null
docker compose up -d --build

Write-Host "`nAll set! 🚀" -ForegroundColor Green
Write-Host "API:     http://localhost:8089"
Write-Host "MinIO:   http://localhost:9001  (admin / admin123)"
Write-Host "Rabbit:  http://localhost:15672 (guest / guest)"
Write-Host "`nNext steps:"
Write-Host "1) In your React app (vision-craft-client), add .env with VITE_API_URL=http://localhost:8089"
Write-Host "2) Wire CreateProjectModal to POST /v1/projects, POST /v1/uploads?projectId=..., POST /v1/jobs"
Write-Host "3) In ProcessingPage, connect to SSE: GET /v1/jobs/{jobId}/stream"
Write-Host "4) When ready, fetch project and load outputs.modelUrl into your Three viewer (supports .gltf now)."
