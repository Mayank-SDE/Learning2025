import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['Left Click + Drag'], description: 'Rotate camera' },
      { keys: ['Right Click + Drag'], description: 'Pan camera' },
      { keys: ['Scroll Wheel'], description: 'Zoom in/out' },
      { keys: ['F'], description: 'Focus on model' }
    ]
  },
  {
    category: 'View Controls',
    items: [
      { keys: ['1'], description: 'Front view' },
      { keys: ['2'], description: 'Right view' },
      { keys: ['3'], description: 'Top view' },
      { keys: ['4'], description: 'Isometric view' },
      { keys: ['Home'], description: 'Reset camera' }
    ]
  },
  {
    category: 'Tools',
    items: [
      { keys: ['M'], description: 'Measure tool' },
      { keys: ['A'], description: 'Annotation tool' },
      { keys: ['S'], description: 'Slice tool' },
      { keys: ['L'], description: 'Layers panel' }
    ]
  },
  {
    category: 'General',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'E'], description: 'Export' },
      { keys: ['?'], description: 'Show shortcuts' },
      { keys: ['Esc'], description: 'Close modal' }
    ]
  }
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const handleStartTour = () => {
    onClose();
    setTimeout(() => {
      if ((window as any).startVisionCraftTour) {
        (window as any).startVisionCraftTour();
      }
    }, 300);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border border-border rounded-2xl shadow-elevation-3 w-full max-w-3xl max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Keyboard className="w-6 h-6 text-primary" />
              </div>
              <h2>Keyboard Shortcuts</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcuts.map((section) => (
                <div key={section.category} className="space-y-3">
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wider">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-sm">{item.description}</span>
                        <div className="flex gap-1">
                          {item.keys.map((key, keyIndex) => (
                            <div key={keyIndex} className="flex items-center gap-1">
                              {keyIndex > 0 && <span className="text-xs text-muted-foreground">+</span>}
                              <Badge variant="secondary" className="font-mono text-xs">
                                {key}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="mb-1">New to VisionCraft?</h4>
                  <p className="text-sm text-muted-foreground">
                    Take an interactive tour to learn all features with step-by-step guidance.
                  </p>
                </div>
                <Button 
                  onClick={handleStartTour}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shrink-0"
                >
                  <Play className="w-4 h-4" />
                  Start Tour
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
