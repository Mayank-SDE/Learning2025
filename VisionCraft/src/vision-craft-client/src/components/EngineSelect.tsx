import { useState } from 'react';

export type EngineId = 'COLMAP'|'MESHROOM'|'OPENMVG'|'VISIONCRAFT_AI'|'LIDAR'|'MIXED';

const ENGINES: { id: EngineId; label: string; desc: string }[] = [
  { id: 'COLMAP', label: 'COLMAP', desc: 'Classical SfM+MVS' },
  { id: 'MESHROOM', label: 'Meshroom', desc: 'OpenMVG/OpenMVS pipeline' },
  { id: 'OPENMVG', label: 'OpenMVG', desc: 'Academic photogrammetry' },
  { id: 'VISIONCRAFT_AI', label: 'VisionCraft-AI', desc: 'Our Python AI pipeline' },
  { id: 'LIDAR', label: 'LiDAR → Mesh', desc: 'LAS/LAZ/PLY to mesh' },
  { id: 'MIXED', label: 'Mixed (Photo+LiDAR)', desc: 'Fuse both' },
];

export function EngineSelect({ value, onChange }: { value?: EngineId; onChange: (e: EngineId)=>void }) {
  const [sel, setSel] = useState<EngineId>(value ?? 'VISIONCRAFT_AI');
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Photogrammetry Engine</label>
      <select
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
        value={sel}
        onChange={(e) => { const v = e.target.value as EngineId; setSel(v); onChange(v); }}
      >
        {ENGINES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
      </select>
      <p className="text-xs text-neutral-400">
        {ENGINES.find(x => x.id === sel)?.desc}
      </p>
    </div>
  );
}
