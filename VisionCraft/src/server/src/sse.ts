// minimal Server-Sent Events pub/sub for job progress

const subscribers = new Map<string, Set<any>>();

export function sseSubscribe(jobId: string, reply: any) {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // keep-alive ping
  reply.raw.write(':\n\n');

  let set = subscribers.get(jobId);
  if (!set) {
    set = new Set<any>();
    subscribers.set(jobId, set);
  }
  set.add(reply);

  reply.raw.on('close', () => {
    const s = subscribers.get(jobId);
    if (s) {
      s.delete(reply);
      if (s.size === 0) subscribers.delete(jobId);
    }
  });
}

export function sseEmit(jobId: string, data: unknown) {
  const set = subscribers.get(jobId);
  if (!set) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const r of set) {
    try { r.raw.write(payload); } catch { /* ignore */ }
  }
}
