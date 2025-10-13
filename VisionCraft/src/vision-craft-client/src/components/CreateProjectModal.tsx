// CreateProjectModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Upload, FileImage, FolderArchive, Settings2, Info, Trash2, Star
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useApp, type Project } from "./AppContext";
import { toast } from "sonner";
import { EnginePicker, type Engine } from "./EnginePicker";
import { EngineParams, DEFAULT_PARAMS, type PhotogrammetryParams } from "./EngineParams";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// API
import {
  createProject as apiCreateProject,
  uploadFiles as apiUploadFiles,
  startJob as apiStartJob,
  type EngineId,
} from "../lib/api";

type Step = "form" | "upload" | "engine" | "uploading";
interface CreateProjectModalProps { open: boolean; onClose: () => void; }
type Preview = { url: string; isImage: boolean; name: string; size: number };

// ---- map UI engine ids to backend EngineId ----
function toEngineId(ui: string, projectType: "photogrammetry" | "lidar" | "mixed"): EngineId {
  // prefer explicit photogrammetry engines; fall back to type
  const map: Record<string, EngineId> = {
    visioncraft: "VISIONCRAFT_AI",
    colmap: "COLMAP",
    meshroom: "MESHROOM",
    "autodesk-recap": "OPENMVG",     // pick closest if your API uses OPENMVG/other
    realitycapture: "OPENMVG",
    "3df-zephyr": "OPENMVG",
    contextcapture: "OPENMVG",
    polycam: "OPENMVG",
  };
  if (map[ui]) return map[ui];
  if (projectType === "lidar") return "LIDAR";
  if (projectType === "mixed") return "MIXED";
  return "VISIONCRAFT_AI";
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const { addProject, setCurrentView, setCurrentProject } = useApp();

  const [step, setStep] = useState<Step>("form");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<"photogrammetry" | "lidar" | "mixed">("photogrammetry");

  const [files, setFiles] = useState<File[]>([]);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [engineId, setEngineId] = useState<string>("visioncraft");
  const [params, setParams] = useState<PhotogrammetryParams>(DEFAULT_PARAMS);

  const engines: Engine[] = useMemo(
    () => [
      { id: "visioncraft", label: "VisionCraft (AI)", kind: "local" },
      { id: "colmap", label: "COLMAP", kind: "local" },
      { id: "meshroom", label: "Meshroom (AliceVision)", kind: "local" },
      { id: "autodesk-recap", label: "Autodesk ReCap", kind: "saas" },
      { id: "realitycapture", label: "RealityCapture", kind: "saas" },
      { id: "3df-zephyr", label: "3DF Zephyr", kind: "saas" },
      { id: "contextcapture", label: "Bentley ContextCapture", kind: "saas" },
      { id: "polycam", label: "Polycam", kind: "saas" },
    ],
    []
  );

  // Hidden file input (kept mounted outside animations)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onPickFiles = () => fileInputRef.current?.click();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.currentTarget.files;
    if (!list?.length) return;
    setFiles(prev => [...prev, ...Array.from(list)]);
    e.currentTarget.value = ""; // allow reselecting same files
  };

  // Drag/drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    if (thumbIdx === i) setThumbIdx(0);
  };

  // Previews (cleanup URLs)
  const [previews, setPreviews] = useState<Preview[]>([]);
  useEffect(() => {
    const urls = files.map(f => ({
      url: URL.createObjectURL(f),
      isImage: f.type.startsWith("image/"),
      name: f.name,
      size: f.size,
    }));
    setPreviews(urls);
    return () => urls.forEach(p => URL.revokeObjectURL(p.url));
  }, [files]);

  // Navigation
  const nextFromForm = () => {
    if (!projectName.trim()) return toast.error("Please enter a project name");
    setStep("upload");
  };
  const nextFromUpload = () => {
    if (files.length === 0) return toast.error("Please upload at least one file");
    setStep("engine");
  };

  // ---- Real create + upload + start job ----
  const handleCreateProject = async () => {
    try {
      setStep("uploading");
      setUploadProgress(0);

      // 1) Create project in API
      setUploadProgress(5);
      const created = await apiCreateProject({
  name: projectName.trim(),
  description: description.trim() || undefined,
  type: projectType,                              // <-- send it
});

      // Build a local thumbnail for cards (server may not return one)
      const thumbnail = files[thumbIdx] ? URL.createObjectURL(files[thumbIdx]) : undefined;
      const engine = engines.find(e => e.id === engineId);

      const localProject: Project = {
        id: created.id,
        name: created.name,
        description: created.description,
        status: "processing",
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        fileCount: files.length,
        type: projectType,
        thumbnail,
        engineId,
        engineKind: engine?.kind,
        params,
        outputs: created.outputs, // keep if server provided
      };

      // optimistic add so user sees it immediately
      addProject(localProject);
      setCurrentProject(localProject);

      // 2) Upload files
      setUploadProgress(15);
      await apiUploadFiles(created.id, files, (pct) => setUploadProgress(Math.min(90, Math.max(20, pct))));

      // 3) Start reconstruction job
      setUploadProgress(92);
      const job = await apiStartJob(
  created.id,
  toEngineId(engineId, projectType),
  params                                         // <-- send params through
);
      setUploadProgress(100);

      toast.success(`Started reconstruction • ${engine?.label ?? engineId}`, {
        description: `Job ${job.jobId} queued (${job.engine})`,
      });

      // Transition to processing page
      setTimeout(() => {
        handleClose();
        setCurrentView("processing");
      }, 250);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start reconstruction", {
        description: typeof err?.message === "string" ? err.message : "Check your server and try again.",
      });
      setStep("engine");
      setUploadProgress(0);
    }
  };

  const reset = () => {
    setStep("form");
    setProjectName(""); setDescription("");
    setProjectType("photogrammetry");
    setFiles([]); setThumbIdx(0);
    setUploadProgress(0);
    setEngineId("visioncraft"); setParams(DEFAULT_PARAMS);
  };
  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.zip"
        onChange={handleFileSelect}
        style={{ position: "absolute", width: 1, height: 1, left: -9999, top: -9999 }}
      />

      <TooltipProvider delayDuration={120}>
        <AnimatePresence>
          {/* The overlay itself can scroll on very small heights */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop — soft but visible */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Center wrapper (top on mobile, centered on ≥sm) */}
            <div className="min-h-full flex items-start sm:items-center justify-center p-4">
              {/* Modal */}
              <motion.div
                role="dialog" aria-modal="true"
                initial={{ opacity: 0, scale: .98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: .98, y: 12 }}
                transition={{ type: "spring", damping: 24, stiffness: 300 }}
                className="
                  relative w-full max-w-4xl
                  bg-card border border-border rounded-2xl shadow-elevation-3
                  flex flex-col overflow-scroll
                  max-h-[90vh] sm:max-h-[80vh]
                  sm:mt-6
                  h-[500px]
                "
              >
                {/* Sticky header inside modal */}
                <div className="shrink-0 sticky top-0 z-10 bg-card/95 backdrop-blur p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2>Create New Project</h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Upload your photos (or a ZIP) and choose a reconstruction engine to generate the 3D model.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Button aria-label="Close" variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Body — must have min-h-0 to enable scrolling inside flex */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-6 space-y-8">
                  {step === "form" && (
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Project Name *</Label>
                        <Input
                          id="name"
                          value={projectName}
                          onChange={(e)=>setProjectName(e.target.value)}
                          placeholder="e.g., Industrial Facility Scan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea
                          id="desc"
                          rows={3}
                          value={description}
                          onChange={(e)=>setDescription(e.target.value)}
                          placeholder="Optional project description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Type</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["photogrammetry","lidar","mixed"] as const).map(t => (
                            <Button key={t} variant={projectType===t?"default":"outline"} onClick={()=>setProjectType(t)}>
                              {t.charAt(0).toUpperCase()+t.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === "upload" && (
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      {/* Drop zone */}
                      <div
                        onDragOver={(e)=>{e.preventDefault(); setIsDragging(true);}}
                        onDragLeave={()=>setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all
                          ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"}`}
                      >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="mb-1">Drag & Drop Files</h3>
                        <p className="text-muted-foreground mb-4">or click to browse</p>
                        <Button type="button" variant="outline" onClick={onPickFiles}>
                          Select from Device
                        </Button>
                        <p className="text-sm text-muted-foreground mt-3">
                          Supports: Images (JPG, PNG), ZIP archives
                        </p>
                      </div>

                      {/* Row-wise list */}
                      {files.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Selected Files ({files.length})</Label>
                            <Badge variant="secondary">
                              {(files.reduce((a,f)=>a+f.size,0)/1024/1024).toFixed(2)} MB
                            </Badge>
                          </div>

                          <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                            {previews.map((p, i) => (
                              <li key={`${p.name}-${i}`} className="flex items-center gap-3 p-3 bg-muted/20">
                                {/* Left thumbnail */}
                                <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden border border-border bg-background">
                                  {p.isImage ? (
                                    <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full grid place-items-center text-muted-foreground">
                                      <FileImage className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>

                                {/* Middle: name + meta */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(p.size/1024/1024).toFixed(2)} MB {i===thumbIdx && <span className="ml-2">• cover</span>}
                                  </p>
                                </div>

                                {/* Right: actions */}
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant={thumbIdx===i?"default":"outline"} className="h-8"
                                              onClick={()=>setThumbIdx(i)}>
                                        <Star className="w-4 h-4 mr-1" />
                                        {thumbIdx===i?"Cover":"Set cover"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Use this image as the project thumbnail.</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8" onClick={()=>removeFile(i)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove from selection</TooltipContent>
                                  </Tooltip>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === "engine" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-primary" />
                        <h3>Reconstruction Settings</h3>
                      </div>
                      <EnginePicker value={engineId} onChange={setEngineId} engines={engines} />
                      <Separator />
                      <EngineParams value={params} onChange={setParams} />
                    </motion.div>
                  )}

                  {step === "uploading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 py-8 text-center">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <FolderArchive className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div>
                        <h3 className="mb-2">Uploading & Starting Job...</h3>
                        <p className="text-muted-foreground">Do not close this window</p>
                      </div>
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Sticky footer */}
                {step !== "uploading" && (
                  <div className="shrink-0 sticky bottom-0 z-10 bg-card/95 backdrop-blur border-t border-border p-5 flex items-center justify-between">
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <div className="flex gap-3">
                      {step === "upload" && <Button variant="outline" onClick={()=>setStep("form")}>Back</Button>}
                      {step === "engine" && <Button variant="outline" onClick={()=>setStep("upload")}>Back</Button>}
                      <Button
                        onClick={ step === "form" ? nextFromForm : step === "upload" ? nextFromUpload : handleCreateProject }
                        className="min-w-32"
                      >
                        {step === "form" ? "Next" : step === "upload" ? "Next" : "Create & Start"}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </AnimatePresence>
      </TooltipProvider>
    </>
  );
}
