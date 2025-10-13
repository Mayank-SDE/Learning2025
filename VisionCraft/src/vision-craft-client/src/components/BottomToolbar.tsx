import { motion } from 'motion/react';
import {
  Home,
  RotateCcw,
  Camera,
  Maximize,
  Undo2,
  Redo2,
  Download,
  Share2
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { toast } from 'sonner';

const CAMERA_PRESETS = [
  { name: 'Top', position: [0, 10, 0] },
  { name: 'Front', position: [0, 0, 10] },
  { name: 'Right', position: [10, 0, 0] },
  { name: 'Left', position: [-10, 0, 0] },
  { name: 'Isometric', position: [7, 7, 7] }
];

export function BottomToolbar() {
  const handleScreenshot = () => {
    toast.success('Screenshot saved to downloads');
  };

  const handleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          toast.error('Fullscreen not supported in this environment');
        });
      } else {
        document.exitFullscreen();
      }
    } catch (error) {
      toast.error('Fullscreen not supported in this environment');
    }
  };

  const handleReset = () => {
    toast.info('Camera reset to default view');
  };

  const handleUndo = () => {
    toast.info('Action undone');
  };

  const handleRedo = () => {
    toast.info('Action redone');
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', damping: 20 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
    >
      <div className="glass-panel rounded-full px-3 py-2 shadow-elevation-3 flex items-center gap-1">
        <TooltipProvider>
          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Home className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Camera</p>
              <span className="text-xs text-muted-foreground">Home</span>
            </TooltipContent>
          </Tooltip>

          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                className="rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Undo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
              <span className="text-xs text-muted-foreground">Ctrl + Z</span>
            </TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                className="rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Redo2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
              <span className="text-xs text-muted-foreground">Ctrl + Shift + Z</span>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Camera Presets */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-primary/10 hover:text-primary"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Camera Presets</p>
                <span className="text-xs text-muted-foreground">1-4</span>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuItem onClick={() => toast.info('Camera: Top view')}>
                Top View <span className="ml-auto text-xs text-muted-foreground">3</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Camera: Front view')}>
                Front View <span className="ml-auto text-xs text-muted-foreground">1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Camera: Right view')}>
                Right View <span className="ml-auto text-xs text-muted-foreground">2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Camera: Left view')}>
                Left View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Camera: Isometric view')}>
                Isometric <span className="ml-auto text-xs text-muted-foreground">4</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Screenshot */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleScreenshot}
                className="rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Download className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Screenshot</p>
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fullscreen</p>
              <span className="text-xs text-muted-foreground">F11</span>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => toast.info('Share link copied to clipboard')}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
              <span className="text-xs text-muted-foreground">Ctrl + Shift + S</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
