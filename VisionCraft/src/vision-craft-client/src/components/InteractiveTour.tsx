import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Play, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useApp } from './AppContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform when step is shown
  view?: string; // Required view for this step
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VisionCraft',
    description: 'Transform your photos into professional 3D models with AI-powered photogrammetry. Let\'s explore the interface!',
    target: 'body',
    placement: 'bottom',
    view: 'dashboard'
  },
  {
    id: 'topbar',
    title: 'Top Navigation Bar',
    description: 'Access export (Ctrl+E), share (Ctrl+Shift+S), keyboard shortcuts (?), theme toggle, notifications, and your profile.',
    target: '[data-tour="topbar"]',
    placement: 'bottom',
    view: 'dashboard'
  },
  {
    id: 'projects',
    title: 'Projects Sidebar',
    description: 'View all your projects here. Click on any project to load it into the viewer. Create new projects with the + button.',
    target: '[data-tour="projects-sidebar"]',
    placement: 'right',
    view: 'dashboard'
  },
  {
    id: 'viewer',
    title: '3D Model Viewer',
    description: 'Interact with your 3D model here. Left-click + drag to rotate, right-click + drag to pan, scroll to zoom. Press F to focus on the model.',
    target: '[data-tour="viewer"]',
    placement: 'left',
    view: 'dashboard'
  },
  {
    id: 'tools',
    title: 'Tools Panel',
    description: 'Access powerful tools: Measure (M), Annotate (A), Slice (S), Layers (L), Lighting, and Materials. Click the tabs to explore each tool.',
    target: '[data-tour="tools-panel"]',
    placement: 'left',
    view: 'dashboard'
  },
  {
    id: 'measure',
    title: 'Measurement Tool',
    description: 'Add measurements to your model. Change units and see real-time distance calculations.',
    target: '[data-tour="measure-tab"]',
    placement: 'left',
    view: 'dashboard',
    action: () => {
      const measureTab = document.querySelector('[data-tour="measure-tab"]') as HTMLElement;
      measureTab?.click();
    }
  },
  {
    id: 'annotate',
    title: 'Annotation Tool',
    description: 'Add text annotations to mark important features on your model.',
    target: '[data-tour="annotate-tab"]',
    placement: 'left',
    view: 'dashboard',
    action: () => {
      const annotateTab = document.querySelector('[data-tour="annotate-tab"]') as HTMLElement;
      annotateTab?.click();
    }
  },
  {
    id: 'images',
    title: 'Source Images',
    description: 'View all source images used to create the 3D model. See camera positions, delete images, or add new ones to regenerate.',
    target: '[data-tour="images-panel"]',
    placement: 'top',
    view: 'dashboard'
  },
  {
    id: 'bottom-toolbar',
    title: 'Bottom Toolbar',
    description: 'Quick access to view modes, camera presets, and rendering options. Toggle wireframe, reset camera, or change view angles.',
    target: '[data-tour="bottom-toolbar"]',
    placement: 'top',
    view: 'dashboard'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You can always restart this tour from the help menu or press ? to see keyboard shortcuts. Happy 3D modeling!',
    target: 'body',
    placement: 'bottom',
    view: 'dashboard'
  }
];

interface InteractiveTourProps {
  onComplete?: () => void; 
}

export function InteractiveTour({ onComplete }: InteractiveTourProps) {
  const { currentView, setCurrentView } = useApp();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const updateHighlight = useCallback(() => {
    if (!step || !isActive) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      // For 'body', use a virtual anchor at the viewport center so our
      // placement math isn't using the full-screen rect.
   if (step.target === 'body') {
     setHighlightPosition({
       top: window.innerHeight / 2,
       left: window.innerWidth / 2,
       width: 0,
       height: 0
     });
     return;
   }
      setHighlightPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });

    }
  }, [step, isActive]);

  useEffect(() => {
    if (isActive && step) {
      // Navigate to required view if needed
      if (step.view && currentView !== step.view) {
        setCurrentView(step.view);
      }

      // Execute step action if any
      setTimeout(() => {
       const el = document.querySelector(step.target) as HTMLElement | null;
       if (el && step.target !== 'body') {
         el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
       }
       // run any step-side action (e.g., opening tabs) after scroll starts
       if (step.action) step.action();
       // measure again on the next frame to get the post-scroll rect
       requestAnimationFrame(updateHighlight);
      }, 300);
     // Prevent page scroll while tour overlay is on
     const prevOverflow = document.body.style.overflow;
     document.body.style.overflow = 'hidden';
      // Update highlight on resize/scroll
      window.addEventListener('resize', updateHighlight);
      window.addEventListener('scroll', updateHighlight);

      return () => {
        window.removeEventListener('resize', updateHighlight);
        window.removeEventListener('scroll', updateHighlight);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isActive, step, currentView, setCurrentView, updateHighlight]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [currentView, setCurrentView]);

  const endTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('visioncraft_tour_completed', 'true');
    if (onComplete) onComplete();
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if tour should auto-start
  useEffect(() => {
    const tourCompleted = localStorage.getItem('visioncraft_tour_completed');
    if (!tourCompleted && currentView === 'dashboard') {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, startTour]);

  // Expose startTour globally
  useEffect(() => {
    (window as any).startVisionCraftTour = startTour;
    return () => {
      delete (window as any).startVisionCraftTour;
    };
  }, [startTour]);

  if (!isActive) return null;

  const getTooltipPosition = () => {
    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 200;
  // If this step anchors to 'body', center horizontally and keep
  // the card comfortably above the bottom chrome (safe area ~80px).
  if (step.target === 'body') {
    const left = (window.innerWidth - tooltipWidth) / 2;
    const bottomSafe = 80; // keep controls/taskbar clear
    const top = Math.min(
      window.innerHeight - tooltipHeight - bottomSafe,
      Math.max(80, window.innerHeight * 0.65 - tooltipHeight / 2)
    );
    return { top, left };
  }
    let top = highlightPosition.top;
    let left = highlightPosition.left;

    switch (step.placement) {
      case 'top':
        top = highlightPosition.top - tooltipHeight - padding;
        left = highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = highlightPosition.top + highlightPosition.height + padding;
        left = highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = highlightPosition.top + highlightPosition.height / 2 - tooltipHeight / 2;
        left = highlightPosition.left - tooltipWidth - padding;
        break;
      case 'right':
        top = highlightPosition.top + highlightPosition.height / 2 - tooltipHeight / 2;
        left = highlightPosition.left + highlightPosition.width + padding;
        break;
    }

    // Keep within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return { top, left };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay with spotlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-auto"
          style={{
            background: 'rgba(0, 0, 0, 0.7)'
          }}
          onClick={endTour}
        />

        {/* Highlighted Element Cutout */}
        {step.target !== 'body' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16
            }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute rounded-lg border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.5)'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            top: tooltipPos.top,
            left: tooltipPos.left
          }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute w-[400px] pointer-events-auto"
        >
          <div className="bg-card border-2 border-primary rounded-2xl shadow-elevation-3 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-white/80">
                      Step {currentStep + 1} of {TOUR_STEPS.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={endTour}
                  className="rounded-full hover:bg-white/20 text-white -mt-1 -mr-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-6">
                {step.description}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={endTour}
                  size="sm"
                  className="gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Tour
                </Button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      size="sm"
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pulse Animation on Target */}
        {step.target !== 'body' && (
          <motion.div
            animate={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16
            }}
            className="absolute rounded-lg pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 rounded-lg border-4 border-primary"
            />
          </motion.div>
        )}
      </div>
      )}
    </AnimatePresence>
  );
}

// Tour Start Button Component (can be used in help menu)
export function TourStartButton() {
  const handleStartTour = () => {
    if ((window as any).startVisionCraftTour) {
      (window as any).startVisionCraftTour();
    }
  };

  return (
    <Button onClick={handleStartTour} variant="outline" className="gap-2">
      <Play className="w-4 h-4" />
      Start Interactive Tour
    </Button>
  );
}
