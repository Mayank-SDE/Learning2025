import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Plus,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Upload,
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { toast } from 'sonner';
import { useApp } from './AppContext';
import { uploadFiles, startJob, type EngineId } from '../lib/api';

interface CameraPosition {
  x: number;
  y: number;
  z: number;
  rotation: { x: number; y: number; z: number };
}

interface SourceImage {
  id: string;
  url: string;       // preview URL
  name: string;
  camera: CameraPosition;
  timestamp: number;
}

// Demo images (kept for nice first-run visuals)
const DEMO_IMAGES: SourceImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400',
    name: 'Front_View_001.jpg',
    camera: { x: 0, y: 1.5, z: 5, rotation: { x: 0, y: 0, z: 0 } },
    timestamp: Date.now() - 3600000,
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400&sat=-100',
    name: 'Right_Side_002.jpg',
    camera: { x: 5, y: 1.5, z: 0, rotation: { x: 0, y: -90, z: 0 } },
    timestamp: Date.now() - 3500000,
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400&hue=30',
    name: 'Top_View_003.jpg',
    camera: { x: 0, y: 6, z: 0, rotation: { x: -90, y: 0, z: 0 } },
    timestamp: Date.now() - 3400000,
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400&hue=60',
    name: 'Back_View_004.jpg',
    camera: { x: 0, y: 1.5, z: -5, rotation: { x: 0, y: 180, z: 0 } },
    timestamp: Date.now() - 3300000,
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400&hue=90',
    name: 'Left_Side_005.jpg',
    camera: { x: -5, y: 1.5, z: 0, rotation: { x: 0, y: 90, z: 0 } },
    timestamp: Date.now() - 3200000,
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1606146485780-31c53c70653d?w=400&hue=120',
    name: 'Angle_View_006.jpg',
    camera: { x: 3, y: 2, z: 3, rotation: { x: -15, y: -45, z: 0 } },
    timestamp: Date.now() - 3100000,
  },
];

interface ImageGalleryPanelProps {
  onRegenerateModel?: () => void;
}

function mapEngineToApi(engineId?: string): EngineId {
  // Map your UI engine ids to API enum
  const id = (engineId ?? '').toLowerCase();
  if (id.includes('colmap')) return 'COLMAP';
  if (id.includes('meshroom')) return 'MESHROOM';
  if (id.includes('openmvg')) return 'OPENMVG';
  if (id.includes('lidar')) return 'LIDAR';
  if (id.includes('mixed')) return 'MIXED';
  // default to our AI engine
  return 'VISIONCRAFT_AI';
}

export function ImageGalleryPanel({ onRegenerateModel }: ImageGalleryPanelProps) {
  const { currentProject, setCurrentView, updateProject, addNotification } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const [images, setImages] = useState<SourceImage[]>(DEMO_IMAGES);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCameraPositions, setShowCameraPositions] = useState(true);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const projectId = currentProject?.id;

  const summaryText = useMemo(() => {
    const count = images.length;
    return `${count} image${count === 1 ? '' : 's'} • Ready for processing`;
  }, [images.length]);

  const handleDeleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('Image removed from dataset');
  };

  // Upload to backend and keep previews
  const handleAddImages = () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const el = e.currentTarget as HTMLInputElement;
      const list = el.files;
      if (!list || list.length === 0) return;

      const files = Array.from(list);
      // optimistic preview
      const added: SourceImage[] = files.map((f, i) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(f),
        name: f.name,
        camera: { x: 0, y: 1.5, z: 5, rotation: { x: 0, y: 0, z: 0 } },
        timestamp: Date.now() + i,
      }));
      setImages(prev => [...prev, ...added]);

      // upload
      const tId = toast.loading('Uploading images…');
      try {
        setUploadPct(10);
        await uploadFiles(projectId, files, (pct) => {
          setUploadPct(pct);
          toast.loading(`Uploading… ${Math.round(pct)}%`, { id: tId });
        });
        toast.success(`${files.length} image(s) uploaded`, { id: tId });
        setUploadPct(null);
        // bump project fileCount visually
        updateProject(projectId, { fileCount: (currentProject?.fileCount ?? 0) + files.length, updatedAt: new Date().toISOString() });
      } catch (err: any) {
        toast.error('Upload failed', { id: tId, description: String(err?.message ?? err) });
        setUploadPct(null);
      } finally {
        // release object URLs after a while if needed (we keep previews for UX)
      }
    };
    input.click();
  };

  const handleRegenerate = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }
    const engine = mapEngineToApi(currentProject?.engineId);
    const tId = toast.loading('Starting model regeneration…');
    try {
      const { jobId } = await startJob(projectId, engine);
      toast.success('Job started', { id: tId, description: `#${jobId}` });
      // mark project as processing
      updateProject(projectId, { status: 'processing', updatedAt: new Date().toISOString() });
      addNotification({
        title: 'Job started',
        message: `Reconstruction job queued • Engine: ${engine}`,
        type: 'info',
        projectId,
      });
      setCurrentView('processing');
      if (onRegenerateModel) onRegenerateModel();
    } catch (err: any) {
      toast.error('Failed to start job', { id: tId, description: String(err?.message ?? err) });
    }
  };

  const handleViewFromCamera = (camera: CameraPosition) => {
    toast.info('Camera view activated', {
      description: `Position: (${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}, ${camera.z.toFixed(1)})`,
    });
  };

  return (
    <div
      data-tour="images-panel"
      className="absolute bottom-0 left-0 right-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm shadow-elevation-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm">Source Images</h4>
              <p className="text-xs text-muted-foreground">
                {summaryText}{uploadPct !== null ? ` • Uploading ${Math.round(uploadPct)}%` : ''}
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="ml-2">
            Photogrammetry
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCameraPositions(!showCameraPositions)}
                  className="gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {showCameraPositions ? 'Hide' : 'Show'} Positions
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle camera position overlay</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleAddImages} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Images
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add more source images</p>
                <span className="text-xs text-muted-foreground">Ctrl+I</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleRegenerate} className="gap-2 bg-primary hover:bg-primary/90">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Model
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate 3D model with current images</p>
                <span className="text-xs text-muted-foreground">Ctrl+R</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Image Gallery */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="h-[200px] px-4 py-3">
              <div className="flex gap-3">
                {images.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group shrink-0"
                  >
                    <div
                      className={`relative w-32 h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedImage === image.id
                          ? 'border-primary shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() =>
                        setSelectedImage(selectedImage === image.id ? null : image.id)
                      }
                    >
                      <img src={image.url} alt={image.name} className="w-full h-full object-cover" />

                      {/* Camera Position Overlay */}
                      {showCameraPositions && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <Camera className="w-3 h-3" />
                              <span>Camera Position</span>
                            </div>
                            <div className="text-[10px] font-mono space-y-0.5">
                              <div>X: {image.camera.x.toFixed(1)}m</div>
                              <div>Y: {image.camera.y.toFixed(1)}m</div>
                              <div>Z: {image.camera.z.toFixed(1)}m</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFromCamera(image.camera);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View from this camera angle</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove from dataset</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Selection Indicator */}
                      {selectedImage === image.id && (
                        <div className="absolute inset-0 bg-primary/10 border-2 border-primary pointer-events-none" />
                      )}
                    </div>

                    {/* Image Name */}
                    <p className="text-xs text-muted-foreground mt-1 truncate w-32 text-center">
                      {image.name}
                    </p>
                  </motion.div>
                ))}

                {/* Add More Card */}
                <div
                  onClick={handleAddImages}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group shrink-0"
                >
                  <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    Add Images
                  </p>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
