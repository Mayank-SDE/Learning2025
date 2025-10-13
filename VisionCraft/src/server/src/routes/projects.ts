import { nanoid } from 'nanoid';
import { BUCKET, minio } from '../minio.js';

const projects = new Map<string, any>();

export async function projectsRoutes(app: any) {
  // create project (metadata only)
  app.post('/', async (req: any, res: any) => {
    const body = req.body || {};
    const id = nanoid();
    const project = {
      id,
      name: body.name ?? 'Untitled',
      description: body.description ?? '',
      type: body.type ?? 'photogrammetry',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.set(id, project);
    res.send(project);
  });

  // get project (expands output URL if present)
  app.get('/:id', async (req: any, res: any) => {
    const p = projects.get(req.params.id);
    if (!p) return res.code(404).send({ error: 'not found' });
    if (p.outputs?.key) {
      p.outputs.modelUrl = await minio.presignedGetObject(BUCKET, p.outputs.key, 60 * 30);
    }
    res.send(p);
  });

  // worker notifies output key; server marks project ready and returns signed URL
  app.post('/:id/outputs', async (req: any, res: any) => {
    const { key } = req.body || {};
    const p = projects.get(req.params.id);
    if (!p) return res.code(404).send();
    const url = await minio.presignedGetObject(BUCKET, key, 60 * 30);
    p.outputs = { modelUrl: url, key };
    p.status = 'ready';
    p.updatedAt = new Date().toISOString();
    res.send({ ok: true });
  });
}
