import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ruler,
  MessageSquare,
  Scissors,
  Layers,
  Sun,
  Palette,
  ChevronRight,
  Plus,
  Trash2,
  Grid3x3,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import type { Measurement, Annotation } from './EnhancedDashboard';
import { toast } from 'sonner';

const TOOLS = [
  { id: 'measure', name: 'Measure', icon: Ruler },
  { id: 'annotate', name: 'Annotate', icon: MessageSquare },
  { id: 'slice', name: 'Slice', icon: Scissors },
  { id: 'layers', name: 'Layers', icon: Layers },
  { id: 'lighting', name: 'Lighting', icon: Sun },
  { id: 'materials', name: 'Materials', icon: Palette }
];

interface EnhancedToolsPanelProps {
  activeTool?: string;
  onActiveToolChange?: (tool: string) => void;
  modelType: string;
  onModelTypeChange: (type: string) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  showShadows: boolean;
  onShowShadowsChange: (show: boolean) => void;
  showWireframe: boolean;
  onShowWireframeChange: (show: boolean) => void;
  modelOpacity: number;
  onModelOpacityChange: (opacity: number) => void;
  roughness: number;
  onRoughnessChange: (roughness: number) => void;
  metalness: number;
  onMetalnessChange: (metalness: number) => void;
  slicePosition?: number;
  onSlicePositionChange: (position: number | undefined) => void;
  sliceAxis: 'x' | 'y' | 'z';
  onSliceAxisChange: (axis: 'x' | 'y' | 'z') => void;
  measurements: Measurement[];
  onAddMeasurement: () => void;
  onRemoveMeasurement: (id: string) => void;
  annotations: Annotation[];
  onAddAnnotation: (text: string) => void;
  onRemoveAnnotation: (id: string) => void;
}

export function EnhancedToolsPanel(props: EnhancedToolsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalActiveTool, setInternalActiveTool] = useState('measure');
  const [annotationText, setAnnotationText] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('meters');

  const activeTool = props.activeTool !== undefined ? props.activeTool : internalActiveTool;
  const setActiveTool = props.onActiveToolChange || setInternalActiveTool;

  const handleAddAnnotation = () => {
    if (!annotationText.trim()) {
      toast.error('Please enter annotation text');
      return;
    }
    props.onAddAnnotation(annotationText);
    setAnnotationText('');
    toast.success('Annotation added');
  };

  const handleAddMeasurement = () => {
    props.onAddMeasurement();
    toast.success('Measurement added (random demo position)');
  };

  const convertDistance = (meters: number) => {
    switch (measurementUnit) {
      case 'feet':
        return (meters * 3.28084).toFixed(2) + ' ft';
      case 'inches':
        return (meters * 39.3701).toFixed(2) + ' in';
      default:
        return meters.toFixed(2) + ' m';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 48 : 320 }}
      className="border-l border-border bg-card/50 backdrop-blur-sm flex flex-col relative"
    >
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-4 top-4 z-10 rounded-full bg-card border border-border shadow-md"
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </Button>

      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 p-2"
          >
            {TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                size="icon"
                onClick={() => {
                  setActiveTool(tool.id);
                  setIsCollapsed(false);
                }}
                title={tool.name}
              >
                <tool.icon className="w-5 h-5" />
              </Button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3>Tools & Settings</h3>
            </div>

            {/* Tool Tabs */}
            <Tabs value={activeTool} onValueChange={setActiveTool} className="flex-1 flex flex-col">
              <TooltipProvider>
                <TabsList className="grid grid-cols-3 mx-4 mt-4">
                  {TOOLS.slice(0, 3).map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <span>
                          <TabsTrigger 
                            value={tool.id} 
                            className="gap-2"
                            data-tour={`${tool.id}-tab`}
                          >
                            <tool.icon className="w-4 h-4" />
                          </TabsTrigger>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{tool.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {tool.id === 'measure' && 'M'}
                          {tool.id === 'annotate' && 'A'}
                          {tool.id === 'slice' && 'S'}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-3 mx-4 mt-2">
                  {TOOLS.slice(3).map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <span>
                          <TabsTrigger value={tool.id} className="gap-2">
                            <tool.icon className="w-4 h-4" />
                          </TabsTrigger>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{tool.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {tool.id === 'layers' && 'L'}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TabsList>
              </TooltipProvider>

              <ScrollArea className="flex-1 mt-4">
                {/* Measure Tool */}
                <TabsContent value="measure" className="px-4 pb-4 space-y-4">
                  <div>
                    <Label>Units</Label>
                    <Select value={measurementUnit} onValueChange={setMeasurementUnit}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meters">Meters (m)</SelectItem>
                        <SelectItem value="feet">Feet (ft)</SelectItem>
                        <SelectItem value="inches">Inches (in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddMeasurement} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Random Measurement
                  </Button>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Measurements ({props.measurements.length})</Label>
                    </div>
                    {props.measurements.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                        No measurements yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {props.measurements.map((measurement) => (
                          <div
                            key={measurement.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">
                                  {convertDistance(measurement.distance)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Point to Point
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                props.onRemoveMeasurement(measurement.id);
                                toast.info('Measurement removed');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Annotate Tool */}
                <TabsContent value="annotate" className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Add Annotation</Label>
                    <Input
                      placeholder="Enter annotation text..."
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAnnotation();
                        }
                      }}
                    />
                    <Button onClick={handleAddAnnotation} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Annotation
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-2">Active Annotations ({props.annotations.length})</Label>
                    {props.annotations.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg mt-2">
                        No annotations yet
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {props.annotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                                <Badge variant="secondary" className="text-xs">Pin</Badge>
                              </div>
                              <p className="text-sm">{annotation.text}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                props.onRemoveAnnotation(annotation.id);
                                toast.info('Annotation removed');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Slice Tool */}
                <TabsContent value="slice" className="px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Slicing</Label>
                    <Switch
                      checked={props.slicePosition !== undefined}
                      onCheckedChange={(checked) => {
                        props.onSlicePositionChange(checked ? 0 : undefined);
                        toast.info(checked ? 'Slicing enabled' : 'Slicing disabled');
                      }}
                    />
                  </div>

                  {props.slicePosition !== undefined && (
                    <>
                      <div>
                        <Label>Slice Axis</Label>
                        <Select value={props.sliceAxis} onValueChange={(val) => props.onSliceAxisChange(val as 'x' | 'y' | 'z')}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="x">X Axis</SelectItem>
                            <SelectItem value="y">Y Axis</SelectItem>
                            <SelectItem value="z">Z Axis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Position: {props.slicePosition.toFixed(2)}</Label>
                        <Slider
                          value={[props.slicePosition]}
                          onValueChange={(val) => props.onSlicePositionChange(val[0])}
                          min={-5}
                          max={5}
                          step={0.1}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Layers Tool */}
                <TabsContent value="layers" className="px-4 pb-4 space-y-4">
                  <div>
                    <Label className="mb-3 block">Model Type</Label>
                    <Select value={props.modelType} onValueChange={props.onModelTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industrial">Industrial Complex</SelectItem>
                        <SelectItem value="architecture">Modern Architecture</SelectItem>
                        <SelectItem value="mechanical">Mechanical Parts</SelectItem>
                        <SelectItem value="organic">Organic Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Grid</span>
                      </div>
                      <Switch checked={props.showGrid} onCheckedChange={props.onShowGridChange} />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Shadows</span>
                      </div>
                      <Switch checked={props.showShadows} onCheckedChange={props.onShowShadowsChange} />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        {props.showWireframe ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm">Wireframe</span>
                      </div>
                      <Switch checked={props.showWireframe} onCheckedChange={props.onShowWireframeChange} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Model Opacity: {Math.round(props.modelOpacity * 100)}%</Label>
                    <Slider
                      value={[props.modelOpacity * 100]}
                      onValueChange={(val) => props.onModelOpacityChange(val[0] / 100)}
                      max={100}
                      step={5}
                    />
                  </div>
                </TabsContent>

                {/* Lighting Tool */}
                <TabsContent value="lighting" className="px-4 pb-4 space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary flex items-start gap-2">
                      <Sun className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Lighting is managed automatically. Toggle shadows in the Layers tab.</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shadows">Cast Shadows</Label>
                    <Switch id="shadows" checked={props.showShadows} onCheckedChange={props.onShowShadowsChange} />
                  </div>
                </TabsContent>

                {/* Materials Tool */}
                <TabsContent value="materials" className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Roughness: {(props.roughness * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[props.roughness * 100]}
                      onValueChange={(val) => props.onRoughnessChange(val[0] / 100)}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls surface roughness (0 = glossy, 100 = rough)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Metalness: {(props.metalness * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[props.metalness * 100]}
                      onValueChange={(val) => props.onMetalnessChange(val[0] / 100)}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls metallic appearance (0 = non-metal, 100 = metal)
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="wireframe-mat">Wireframe Mode</Label>
                    <Switch
                      id="wireframe-mat"
                      checked={props.showWireframe}
                      onCheckedChange={props.onShowWireframeChange}
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
