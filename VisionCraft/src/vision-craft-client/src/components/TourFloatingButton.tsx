import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X } from 'lucide-react';
import { Button } from './ui/button';

export function TourFloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if tour has been completed and if button was dismissed
    const tourCompleted = localStorage.getItem('visioncraft_tour_completed');
    const buttonDismissed = sessionStorage.getItem('visioncraft_tour_button_dismissed');
    
    if (!tourCompleted && !buttonDismissed) {
      // Show button after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    if ((window as any).startVisionCraftTour) {
      (window as any).startVisionCraftTour();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('visioncraft_tour_button_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-24 right-6 z-50"
      >
        <div className="relative">
          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border shadow-lg hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-3 h-3" />
          </Button>

          {/* Main button */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Button
              onClick={handleStartTour}
              size="lg"
              className="gap-3 pl-4 pr-6 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-elevation-3 rounded-full"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white">Start Tour</div>
                <div className="text-xs text-white/80">Learn VisionCraft</div>
              </div>
            </Button>
          </motion.div>

          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        </div>

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-card border border-border rounded-lg shadow-lg p-3 w-64 pointer-events-none"
        >
          <div className="relative">
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-border" />
            <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-card" />
            <p className="text-sm mb-2">
              <strong>New to VisionCraft?</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Take a quick interactive tour to discover all the powerful features and shortcuts.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
