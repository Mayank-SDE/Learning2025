import { BUCKET, minio } from '../minio.js';

export async function uploadsRoutes(app: any) {
  app.post('/', async (req: any, res: any) => {
    const projectId = (req.query?.projectId || '').toString();
    if (!projectId) return res.code(400).send({ error: 'projectId required' });

    const parts = req.parts ? await req.parts() : [];
    const saved: string[] = [];

    for await (const part of parts) {
      if (part.type === 'file') {
        const key = `projects/${projectId}/uploads/${Date.now()}_${part.filename}`;
        await minio.putObject(
          BUCKET,
          key,
          part.file,
          part.file?.byteLength || part.file?.length || undefined,
          { 'Content-Type': part.mimetype }
        );
        saved.push(key);
      }
    }

    res.send({ files: saved });
  });
}
