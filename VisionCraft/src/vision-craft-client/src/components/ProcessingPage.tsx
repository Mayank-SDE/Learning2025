import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Image, Grid3x3, Box, Sparkles, FileCode, Zap, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useApp } from './AppContext';
import { toast } from 'sonner';

// API
import { streamProgress, getProject } from '../lib/api';

const PROCESSING_STAGES = [
  { id: 1, key: 'extract',   name: 'Extracting Images', icon: Image,     duration: 15 },
  { id: 2, key: 'matching',  name: 'Feature Matching',  icon: Grid3x3,   duration: 20 },
  { id: 3, key: 'dense',     name: 'Dense Point Cloud', icon: Sparkles,  duration: 25 },
  { id: 4, key: 'mesh',      name: 'Generating Mesh',   icon: Box,       duration: 20 },
  { id: 5, key: 'texture',   name: 'Texturing',         icon: FileCode,  duration: 15 },
  { id: 6, key: 'optimize',  name: 'Optimizing',        icon: Zap,       duration: 5  },
] as const;

type StageItem = typeof PROCESSING_STAGES[number];

export function ProcessingPage() {
  const { currentProject, setCurrentView, updateProject, addNotification } = useApp();

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // store cleanup for SSE / polling
  const stopRef = useRef<null | (() => void)>(null);
  const pollRef = useRef<null | number>(null);

  const stageByName = useMemo(() => {
    const map = new Map<string, number>();
    PROCESSING_STAGES.forEach((s, i) => {
      map.set(s.key, i);
      map.set(s.name.toLowerCase(), i);
    });
    return map;
  }, []);

  useEffect(() => {
    if (!currentProject) return;

    const jobId = sessionStorage.getItem(`vc:lastJobId:${currentProject.id}`) || undefined;

    // helper: finalize success
    const finish = (payload?: any) => {
      // avoid multiple calls
      if (stopRef.current) stopRef.current();
      if (pollRef.current) clearInterval(pollRef.current);
      stopRef.current = null;
      pollRef.current = null;

      setCurrentStageIdx(PROCESSING_STAGES.length);
      setStageProgress(100);
      setOverallProgress(100);

      updateProject(currentProject.id, {
        status: 'ready',
        updatedAt: new Date().toISOString(),
        ...(payload?.outputs ? { outputs: payload.outputs } : {}),
      });

      addNotification({
        title: 'Processing Complete',
        message: `${currentProject.name} is ready to view`,
        type: 'success',
        projectId: currentProject.id,
      });

      toast.success('3D model generated successfully!');
      setTimeout(() => setCurrentView('dashboard'), 1500);
    };

    // helper: handle streaming events from backend
    const onEvent = (e: any) => {
      // expected shapes (we handle several safely):
      // { overall: 42, stageProgress: 18, stage: 'matching' | 1 | 'Feature Matching', status?: 'running'|'completed' }
      if (typeof e?.overall === 'number') setOverallProgress(Math.max(0, Math.min(100, e.overall)));
      if (typeof e?.stageProgress === 'number') setStageProgress(Math.max(0, Math.min(100, e.stageProgress)));

      if (e?.stage != null) {
        let idx = currentStageIdx;
        if (typeof e.stage === 'number') {
          idx = Math.max(0, Math.min(PROCESSING_STAGES.length - 1, e.stage));
        } else if (typeof e.stage === 'string') {
          const found = stageByName.get(e.stage.toLowerCase());
          if (typeof found === 'number') idx = found;
        }
        setCurrentStageIdx(idx);
      }

      if (e?.status === 'completed' || e?.overall >= 100) {
        finish(e);
      }
      if (e?.status === 'failed' || e?.error) {
        toast.error('Processing failed', { description: e?.error ?? 'Unknown error' });
      }
    };

    // Prefer SSE if we know the jobId
    if (jobId) {
      try {
        const stop = streamProgress(jobId, onEvent);
        stopRef.current = stop;
      } catch {
        // If SSE fails, fall back to polling
        startPolling();
      }
    } else {
      startPolling();
    }

    function startPolling() {
      // simple 2s poll; when server flips to ready we finish
      pollRef.current = window.setInterval(async () => {
        try {
          const p = await getProject(currentProject?.id || '');
          if (p.status === 'ready') {
            finish({ outputs: p.outputs });
          }
          // optional: if backend sends numeric progress fields, reflect them
          if ((p as any).overallProgress != null) {
            setOverallProgress(Math.max(0, Math.min(100, Number((p as any).overallProgress))));
          }
          if ((p as any).stageName) {
            const i = stageByName.get(String((p as any).stageName).toLowerCase());
            if (typeof i === 'number') setCurrentStageIdx(i);
          }
          if ((p as any).stageProgress != null) {
            setStageProgress(Math.max(0, Math.min(100, Number((p as any).stageProgress))));
          }
        } catch {
          // ignore intermittent errors
        }
      }, 2000);
    }

    return () => {
      if (stopRef.current) stopRef.current();
      if (pollRef.current) clearInterval(pollRef.current);
      stopRef.current = null;
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]); // re-subscribe per project

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  const isComplete = currentStageIdx >= PROCESSING_STAGES.length;
  const currentStageData: StageItem | undefined =
    !isComplete ? PROCESSING_STAGES[currentStageIdx] : undefined;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => setCurrentView('dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Project Info */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              {currentProject.type || 'photogrammetry'}
            </Badge>
            <h1 className="mb-2">{currentProject.name}</h1>
            <p className="text-muted-foreground">
              {currentProject.fileCount || 0} files • Processing in progress
            </p>
          </div>

          {/* Main Progress Circle */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              {/* Outer Ring */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: overallProgress / 100 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  style={{ strokeDasharray: '100 100' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--electric-blue)" />
                    <stop offset="50%" stopColor="var(--violet)" />
                    <stop offset="100%" stopColor="var(--teal)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {!isComplete ? (
                  <>
                    {currentStageData && (
                      <motion.div
                        key={currentStageData.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-2"
                      >
                        <currentStageData.icon className="w-12 h-12 text-primary" />
                      </motion.div>
                    )}
                    <span className="text-3xl font-bold">{Math.round(overallProgress)}%</span>
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-accent" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Current Stage */}
          {!isComplete && currentStageData && (
            <motion.div
              key={currentStageData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6 mb-8 shadow-elevation-2"
            >
              <div className="flex items-center gap-3 mb-3">
                <currentStageData.icon className="w-5 h-5 text-primary" />
                <h3>{currentStageData.name}</h3>
                <Loader2 className="w-4 h-4 ml-auto animate-spin text-primary" />
              </div>
              <Progress value={stageProgress} className="h-1.5" />
            </motion.div>
          )}

          {/* Stage List */}
          <div className="space-y-3">
            {PROCESSING_STAGES.map((stage, index) => {
              const isActive = index === currentStageIdx;
              const isCompleted = index < currentStageIdx;
              const isPending = index > currentStageIdx;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg transition-all duration-200
                    ${isActive ? 'bg-primary/10 border border-primary/20' : ''}
                    ${isCompleted ? 'bg-accent/5' : ''}
                    ${isPending ? 'opacity-50' : ''}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-accent text-white' : ''}
                    ${isActive ? 'bg-primary text-white' : ''}
                    ${isPending ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <stage.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={isActive ? 'font-medium' : ''}>
                    {stage.name}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-auto"
                    >
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Completion Message */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <h2 className="mb-2">Processing Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Redirecting to viewer...
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
