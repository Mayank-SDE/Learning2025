import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [format, setFormat] = useState('glb');
  const [quality, setQuality] = useState([80]);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`Model exported as ${format.toUpperCase()}`);
    setIsExporting(false);
    onClose();
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
          className="relative bg-card border border-border rounded-2xl shadow-elevation-3 w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2>Export Model</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glb">GLB (Binary)</SelectItem>
                  <SelectItem value="gltf">GLTF (JSON)</SelectItem>
                  <SelectItem value="obj">OBJ</SelectItem>
                  <SelectItem value="ply">PLY</SelectItem>
                  <SelectItem value="fbx">FBX</SelectItem>
                  <SelectItem value="stl">STL</SelectItem>
                  <SelectItem value="pcd">Point Cloud (PCD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quality: {quality[0]}%</Label>
              </div>
              <Slider
                value={quality}
                onValueChange={setQuality}
                min={10}
                max={100}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                Higher quality = larger file size
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="textures"
                  checked={includeTextures}
                  onCheckedChange={(checked) => setIncludeTextures(checked as boolean)}
                />
                <label htmlFor="textures" className="text-sm cursor-pointer">
                  Include textures
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="normals" defaultChecked />
                <label htmlFor="normals" className="text-sm cursor-pointer">
                  Include normals
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="compress" defaultChecked />
                <label htmlFor="compress" className="text-sm cursor-pointer">
                  Compress output
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Est. size: ~{Math.round((quality[0] / 100) * 45)}MB
            </p>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
