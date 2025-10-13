import { EnginePicker } from "./EnginePicker";
import { EngineParams, DEFAULT_PARAMS} from "./EngineParams";
import { type PhotogrammetryParams } from "./EngineParams";
import { useState } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCw } from "lucide-react";
import { useApp } from "./AppContext";
import { toast } from "sonner";

export function RegenerateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentProject, updateProject, setCurrentView } = useApp();
  const [engine, setEngine] = useState("colmap");
  const [params, setParams] = useState<PhotogrammetryParams>(DEFAULT_PARAMS);

  if (!open) return null;

  const start = () => {
    if (!currentProject) return;
    // UI-only: flip status and navigate; backend wiring later.
    updateProject(currentProject.id, { status: "processing", updatedAt: new Date().toISOString() });
    toast.info(`Regenerating with ${engine.toUpperCase()}…`);
    onClose();
    setCurrentView("processing");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
        <motion.div initial={{ opacity: 0, scale:.96, y: 10 }} animate={{ opacity: 1, scale:1, y:0 }}
          exit={{ opacity: 0, scale:.96, y:10 }} transition={{ type:"spring", damping:22 }}
          className="relative bg-card border border-border rounded-2xl shadow-elevation-3 w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="flex items-center gap-2"><RotateCw className="w-5 h-5"/> Regenerate Model</h3>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
          </div>
          <div className="p-6 space-y-6 overflow-auto max-h-[calc(90vh-140px)]">
            <EnginePicker value={engine} onChange={setEngine}/>
            <EngineParams value={params} onChange={setParams}/>
          </div>
          <div className="p-6 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={start} className="gap-2"><RotateCw className="w-4 h-4"/> Start</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
