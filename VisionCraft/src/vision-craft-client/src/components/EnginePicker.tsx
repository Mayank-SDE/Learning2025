import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

export type Engine = {
  id: string;
  label: string;
  kind: "local" | "saas";
  desc?: string;
};

const DEFAULT_ENGINES: Engine[] = [
  // First-party / local
  { id: "visioncraft", label: "VisionCraft (AI)", kind: "local", desc: "Our AI photogrammetry pipeline" },
  { id: "colmap", label: "COLMAP", kind: "local", desc: "Classical SfM + MVS" },
  { id: "meshroom", label: "Meshroom (AliceVision)", kind: "local" },

  // Third-party SaaS / APIs
  { id: "autodesk-recap", label: "Autodesk ReCap", kind: "saas", desc: "Autodesk API" },
  { id: "realitycapture", label: "RealityCapture", kind: "saas" },
  { id: "3df-zephyr", label: "3DF Zephyr", kind: "saas" },
  { id: "contextcapture", label: "Bentley ContextCapture", kind: "saas" },
  { id: "polycam", label: "Polycam", kind: "saas" },
];

export function EnginePicker({
  value,
  onChange,
  engines = DEFAULT_ENGINES,
}: {
  value?: string;
  onChange: (id: string) => void;
  engines?: Engine[];
}) {
  const [id, setId] = useState(value ?? engines[0]?.id);
  useEffect(() => {
    if (id) onChange(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cur = engines.find((e) => e.id === id);

  return (
    <div className="space-y-2">
      <Label>Photogrammetry Engine</Label>
      <Select value={id} onValueChange={setId}>
        <SelectTrigger>
          <SelectValue placeholder="Choose engine" />
        </SelectTrigger>
        <SelectContent>
          {engines.map((e) => (
            <SelectItem key={e.id} value={e.id} className="flex items-center gap-2">
              <span className="mr-2">{e.label}</span>
              <Badge variant="secondary" className="capitalize">{e.kind}</Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {cur && (
        <p className="text-xs text-muted-foreground">
          Selected: {cur.label} • <span className="capitalize">{cur.kind}</span>
          {cur.desc ? ` — ${cur.desc}` : ""}
        </p>
      )}
    </div>
  );
}
