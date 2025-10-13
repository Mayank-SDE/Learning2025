import { channel, QUEUE } from '../rabbit.js';

const ENGINE_TO_TYPE: Record<string, 'photogrammetry' | 'lidar' | 'mixed'> = {
  COLMAP: 'photogrammetry',
  MESHROOM: 'photogrammetry',
  OPENMVG: 'photogrammetry',
  VISIONCRAFT_AI: 'photogrammetry',
  LIDAR: 'lidar',
  MIXED: 'mixed'
};

export async function jobsRoutes(app: any) {
  // start a job
  app.post('/', async (req: any, res: any) => {
    const { projectId, engine, type: typeIn } = req.body || {};
    if (!projectId) return res.code(400).send({ error: 'projectId required' });

    const type = engine
      ? ENGINE_TO_TYPE[engine] ?? 'photogrammetry'
      : (typeIn ?? 'photogrammetry');

    const normalizedEngine =
      engine ?? (type === 'lidar' ? 'LIDAR' : type === 'mixed' ? 'MIXED' : 'VISIONCRAFT_AI');

    const jobId = `${projectId}-${Date.now()}`;

    const ch = await channel();
    ch.sendToQueue(
      QUEUE,
      Buffer.from(JSON.stringify({ jobId, projectId, type, engine: normalizedEngine })),
      { persistent: true }
    );

    res.send({ jobId, type, engine: normalizedEngine });
  });

  // worker pushes progress here; we fan out via SSE
  app.post('/:id/progress', async (req: any, res: any) => {
    const { sseEmit } = await import('../sse.js');
    const { stage, pct, overall, message } = req.body || {};
    sseEmit(req.params.id, { stage, pct, overall, message });
    res.send({ ok: true });
  });

  // client subscribes to SSE
  app.get('/:id/stream', async (req: any, reply: any) => {
    const { sseSubscribe } = await import('../sse.js');
    sseSubscribe(req.params.id, reply);
  });
}
