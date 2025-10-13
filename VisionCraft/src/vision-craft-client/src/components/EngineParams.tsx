import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";

export type PhotogrammetryParams = {
  coarse_lr: number;
  coarse_iters: number;
  fine_lr: number;
  fine_iters: number;
  opt_level: "refine" | "refine+depth";
  match_conf_thr: number;
  shared_intrinsics: boolean;
  scenegraph: "complete" | "exhaustive" | "sequential";
  min_conf_thr: number;
  cam_size: number;
  tsdf_threshold: number;
  as_pointcloud: boolean;
  mask_sky: boolean;
  cleanup_depthmaps: boolean;
  transparent_cameras: boolean;
};

export const DEFAULT_PARAMS: PhotogrammetryParams = {
  coarse_lr: 0.05,
  coarse_iters: 400,
  fine_lr: 0.02,
  fine_iters: 300,
  opt_level: "refine",
  match_conf_thr: 10,
  shared_intrinsics: true,
  scenegraph: "complete",
  min_conf_thr: 2,
  cam_size: 1,
  tsdf_threshold: 0.25,
  as_pointcloud: false,
  mask_sky: true,
  cleanup_depthmaps: true,
  transparent_cameras: false,
};

export function EngineParams({
  value,
  onChange,
}: {
  value?: PhotogrammetryParams;
  onChange: (p: PhotogrammetryParams) => void;
}) {
  const [p, setP] = useState<PhotogrammetryParams>(value ?? DEFAULT_PARAMS);
  useEffect(() => onChange(p), [p]); // eslint-disable-line

  const num = (k: keyof PhotogrammetryParams, v: number) =>
    setP((s) => ({ ...s, [k]: v }));

  const bool = (k: keyof PhotogrammetryParams, v: boolean) =>
    setP((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-2">
      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Coarse LR ({p.coarse_lr.toFixed(3)})</Label>
        <Slider min={0.01} max={0.2} step={0.005} value={[p.coarse_lr]} onValueChange={([v]) => num("coarse_lr", v)} />
      </div>
      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Coarse Iters ({p.coarse_iters})</Label>
        <Slider min={0} max={1000} step={10} value={[p.coarse_iters]} onValueChange={([v]) => num("coarse_iters", v)} />
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Fine LR ({p.fine_lr.toFixed(3)})</Label>
        <Slider min={0.005} max={0.05} step={0.001} value={[p.fine_lr]} onValueChange={([v]) => num("fine_lr", v)} />
      </div>
      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Fine Iters ({p.fine_iters})</Label>
        <Slider min={0} max={1000} step={10} value={[p.fine_iters]} onValueChange={([v]) => num("fine_iters", v)} />
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Optimization Level</Label>
        <Select value={p.opt_level} onValueChange={(v: any) => setP((s) => ({ ...s, opt_level: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="refine">refine</SelectItem>
            <SelectItem value="refine+depth">refine+depth</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Match Confidence ({p.match_conf_thr})</Label>
        <Slider className="" min={0} max={30} step={1} value={[p.match_conf_thr]} onValueChange={([v]) => num("match_conf_thr", v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border">
        <div className="p-2">
          <Label>Shared Intrinsics</Label>
          <p className="text-xs text-muted-foreground">Assume same camera intrinsics</p>
        </div>
        <Switch className="ml-2 cursor-pointer" checked={p.shared_intrinsics} onCheckedChange={(v) => bool("shared_intrinsics", v)} />
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Scenegraph</Label>
        <Select value={p.scenegraph} onValueChange={(v: any) => setP((s) => ({ ...s, scenegraph: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="complete">complete</SelectItem>
            <SelectItem value="exhaustive">exhaustive</SelectItem>
            <SelectItem value="sequential">sequential</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Min Confidence ({p.min_conf_thr})</Label>
        <Slider min={0} max={10} step={1} value={[p.min_conf_thr]} onValueChange={([v]) => num("min_conf_thr", v)} />
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>Camera Size ({p.cam_size.toFixed(3)})</Label>
        <Slider min={0.001} max={10} step={0.001} value={[p.cam_size]} onValueChange={([v]) => num("cam_size", v)} />
      </div>

      <div className="p-2 flex flex-wrap justify-center items-center">
        <Label>TSDF Threshold ({p.tsdf_threshold.toFixed(2)})</Label>
        <Slider min={0} max={1} step={0.01} value={[p.tsdf_threshold]} onValueChange={([v]) => num("tsdf_threshold", v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border">
        <div className="p-2">
          <Label>Output as Point Cloud</Label>
          <p className="text-xs text-muted-foreground">Skip meshing</p>
        </div>
        <Switch className="ml-2 cursor-pointer" checked={p.as_pointcloud} onCheckedChange={(v) => bool("as_pointcloud", v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border">
        <div>
          <Label>Mask Sky</Label>
          <p className="text-xs text-muted-foreground">Remove sky regions</p>
        </div>
        <Switch className="ml-2 cursor-pointer" checked={p.mask_sky} onCheckedChange={(v) => bool("mask_sky", v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border">
        <div>
          <Label>Cleanup Depthmaps</Label>
        </div>
        <Switch className="ml-2 cursor-pointer" checked={p.cleanup_depthmaps} onCheckedChange={(v) => bool("cleanup_depthmaps", v)} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border">
        <div>
          <Label>Transparent Cameras</Label>
        </div>
        <Switch className="ml-2 cursor-pointer"  checked={p.transparent_cameras} onCheckedChange={(v) => bool("transparent_cameras", v)} />
      </div>
    </div>
  );
}
