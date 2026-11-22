import { Crosshair, Focus, Maximize2, MousePointer2, Orbit, Pause, Play, Plus, RotateCcw, Waypoints } from 'lucide-react';
import type { LayoutKind } from '@/types';
import { LAYOUT_LABELS } from '@/lib/graph/registry';
import { computeLayout } from '@/lib/layout';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/controls';

const LAYOUTS: LayoutKind[] = ['force', 'radial', 'circular', 'hierarchical', 'tree', 'grid', 'cluster', 'organic'];

export function GraphControls() {
  const workspace = useActiveWorkspace();
  const setLayoutSettings = useGraphStore((state) => state.setLayoutSettings);
  const applyLayoutPositions = useGraphStore((state) => state.applyLayoutPositions);
  const createNode = useGraphStore((state) => state.createNode);
  const setFocus = useGraphStore((state) => state.setFocus);
  const selectedIds = useGraphStore((state) => state.selectedNodeIds);
  const activeTool = useUIStore((state) => state.activeTool);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const view = useUIStore((state) => state.view);
  const { layout } = workspace.settings;

  const applyLayout = (kind: LayoutKind): void => {
    setLayoutSettings({ kind });
    const settings = { ...layout, kind };
    if (kind !== 'force') {
      const positions = computeLayout({ graph: workspace.graph, settings, focusNodeId: selectedIds[0] });
      applyLayoutPositions(positions, `Apply ${LAYOUT_LABELS[kind]} layout`);
    }
  };

  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#0d1013]/90 p-1.5 backdrop-blur">
      <IconButton label="Select tool" active={activeTool === 'select'} onClick={() => setActiveTool('select')}><MousePointer2 size={14} /></IconButton>
      <IconButton label="Connect nodes (G)" active={activeTool === 'connect'} onClick={() => setActiveTool('connect')}><Waypoints size={14} /></IconButton>
      <IconButton label="Create node (N)" onClick={() => createNode({ title: 'New concept' })}><Plus size={14} /></IconButton>
      <span className="mx-0.5 h-4 w-px bg-white/10" />
      <Select
        aria-label="Graph layout"
        value={layout.kind}
        onChange={(event) => applyLayout(event.target.value as LayoutKind)}
        className="h-7 w-36 py-0 text-[10px]"
      >
        {LAYOUTS.map((kind) => <option key={kind} value={kind}>{LAYOUT_LABELS[kind]}</option>)}
      </Select>
      {layout.kind === 'force' && (
        <IconButton label={layout.running ? 'Pause simulation' : 'Resume simulation'} active={!layout.running} onClick={() => setLayoutSettings({ running: !layout.running })}>
          {layout.running ? <Pause size={14} /> : <Play size={14} />}
        </IconButton>
      )}
      <IconButton label="Reset layout" onClick={() => applyLayout(layout.kind)}><RotateCcw size={14} /></IconButton>
      <IconButton label="Focus selection (F)" onClick={() => selectedIds[0] && setFocus(selectedIds[0])} disabled={!selectedIds[0]}><Focus size={14} /></IconButton>
      <IconButton label="Reset focus" onClick={() => setFocus(null)}><Maximize2 size={14} /></IconButton>
      {view === 'universe' && <span className="hidden items-center gap-1 px-1.5 text-[10px] text-zinc-600 xl:flex"><Orbit size={11} /> drag to orbit</span>}
      <span className="hidden items-center gap-1 px-1.5 text-[10px] text-zinc-600 2xl:flex"><Crosshair size={11} /> shift-click multi-select</span>
    </div>
  );
}
