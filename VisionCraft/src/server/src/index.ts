import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

import { projectsRoutes } from './routes/projects.js';
import { uploadsRoutes } from './routes/uploads.js';
import { jobsRoutes } from './routes/jobs.js';

const app = Fastify({ logger: true });

const ALLOWLIST =
  (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ]) as string[];

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWLIST.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 1024 } });

await app.register(projectsRoutes, { prefix: '/v1/projects' });
await app.register(uploadsRoutes, { prefix: '/v1/uploads' });
await app.register(jobsRoutes, { prefix: '/v1/jobs' });

const port = Number(process.env.PORT ?? 8089);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
