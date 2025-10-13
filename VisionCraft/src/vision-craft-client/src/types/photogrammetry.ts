export type EngineId = 'COLMAP' | 'MESHROOM' | 'OPENMVG' | 'VISIONCRAFT_AI' | 'LIDAR' | 'MIXED';

export type JobProgress = {
  stage: string;
  pct: number;     // stage progress (0-100)
  overall: number; // overall heuristic (0-100)
  message?: string;
};

export type StartJobResponse = { jobId: string; type: string; engine: EngineId };
