// src/lib/api.ts
// Centralized API wrapper for the VisionCraft webapp

// Prefer VITE_API_URL, fallback to VITE_API_BASE, then localhost.
const BASE =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE ??
  'http://localhost:8089';

// -------------------- Shared Types --------------------

export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'error';

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  fileCount?: number;
  type?: 'photogrammetry' | 'lidar' | 'mixed';
  // If your server returns a public S3/MinIO key + a signed/public URL:
  outputs?: {
    key?: string;       // object key (e.g., models/abc.glb)
    modelUrl?: string;  // fully-qualified URL to download/stream the model
  };
  // (Optional) engine info you’re storing client-side:
  engineId?: string;
  engineKind?: 'local' | 'saas';
  params?: unknown;
};

export type EngineId =
  | 'COLMAP'
  | 'MESHROOM'
  | 'OPENMVG'
  | 'VISIONCRAFT_AI'
  | 'LIDAR'
  | 'MIXED';

// Job streaming events (as emitted by /v1/jobs/:id/stream)
export type JobEvent =
  | { type: 'status'; status: ProjectStatus }
  | { type: 'progress'; pct: number; message?: string }
  | { type: 'log'; message: string }
  | { type: 'done'; outputs?: { key?: string; modelUrl?: string } }
  | { type: 'error'; message: string };

// -------------------- Helper --------------------

async function handle<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(text || `HTTP ${r.status}`);
  }
  return (await r.json()) as T;
}

// Build a public URL if server only returned an object key.
// If your server already returns modelUrl, you won’t need this.
export function objectUrlFromKey(key?: string) {
  if (!key) return undefined;
  // Many backends expose a /v1/uploads/public?key=...
  // If you implemented a different route, adjust here.
  const u = new URL('/v1/uploads/public', BASE);
  u.searchParams.set('key', key);
  return u.toString();
}

// -------------------- Projects --------------------

export async function listProjects(): Promise<Project[]> {
  const r = await fetch(`${BASE}/v1/projects`);
  return handle<Project[]>(r);
}

export async function getProject(id: string): Promise<Project> {
  const r = await fetch(`${BASE}/v1/projects/${encodeURIComponent(id)}`);
  return handle<Project>(r);
}

export async function createProject(input: {
  name: string;
  description?: string;
  type?: 'photogrammetry' | 'lidar' | 'mixed';
}): Promise<Project> {
  const r = await fetch(`${BASE}/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handle<Project>(r);
}

export async function deleteProject(id: string): Promise<{ ok: true }> {
  const r = await fetch(`${BASE}/v1/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handle<{ ok: true }>(r);
}

// -------------------- Uploads --------------------

export async function uploadFiles(projectId: string, files: File[], onProgress?: (pct: number)=>void) {
  const form = new FormData();
  for (const f of files) form.append('file', f, f.name);

  return new Promise<{files:string[]}>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/v1/uploads?projectId=${encodeURIComponent(projectId)}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}


// Optionally support removing images (if your server exposes it)
export async function deleteUpload(projectId: string, key: string) {
  const u = new URL(`${BASE}/v1/uploads`);
  u.searchParams.set('projectId', projectId);
  u.searchParams.set('key', key);
  const r = await fetch(u.toString(), { method: 'DELETE' });
  return handle<{ ok: true }>(r);
}

// -------------------- Jobs --------------------

export async function startJob(
  projectId: string,
  engine: EngineId,
  // You can pass through any engine-specific params your server expects
  params?: Record<string, unknown>
): Promise<{ jobId: string; type: string; engine: EngineId }> {
  const r = await fetch(`${BASE}/v1/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, engine, params }),
  });
  return handle<{ jobId: string; type: string; engine: EngineId }>(r);
}

export function streamProgress(
  jobId: string,
  onEvent: (e: JobEvent) => void
): () => void {
  const url = `${BASE}/v1/jobs/${encodeURIComponent(jobId)}/stream`;
  const sse = new EventSource(url);

  sse.onmessage = (m) => {
    try {
      const data = JSON.parse(m.data) as JobEvent;
      onEvent(data);
    } catch {
      // ignore parse errors
    }
  };
  sse.onerror = () => {
    // keep connection alive; server will usually retry
    // you can decide to close here if needed.
  };

  return () => sse.close();
}

// If you expose a way to re-run a job:
export async function restartJob(
  projectId: string,
  engine: EngineId,
  params?: Record<string, unknown>
) {
  return startJob(projectId, engine, params);
}

// -------------------- Convenience --------------------

// Derive a usable model URL from project.outputs
export function getProjectModelUrl(p?: Project): string | undefined {
  if (!p?.outputs) return undefined;
  return p.outputs.modelUrl ?? objectUrlFromKey(p.outputs.key);
}

// Expose BASE for debugging or display
export const API_BASE = BASE;
