import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider, Toggle } from '@/components/ui/controls';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { storageInfo } from '@/lib/persistence/repository';
import { formatBytes } from '@/lib/utils/download';
import type { GraphLayoutSettings, GraphVisualSettings } from '@/types';

type LayoutSlider = 'repulsion' | 'attraction' | 'linkDistance' | 'gravity' | 'damping' | 'collision' | 'speed' | 'strength';

const LAYOUT_SLIDERS: { key: LayoutSlider; label: string; min: number; max: number; step: number }[] = [
  { key: 'repulsion', label: 'Repulsion', min: 0, max: 2000, step: 10 },
  { key: 'attraction', label: 'Attraction', min: 0, max: 2, step: 0.01 },
  { key: 'linkDistance', label: 'Link distance', min: 10, max: 400, step: 5 },
  { key: 'gravity', label: 'Gravity', min: 0, max: 1, step: 0.01 },
  { key: 'damping', label: 'Damping', min: 0, max: 1, step: 0.01 },
  { key: 'collision', label: 'Collision', min: 0, max: 100, step: 1 },
  { key: 'speed', label: 'Speed', min: 0.1, max: 3, step: 0.1 },
  { key: 'strength', label: 'Strength', min: 0, max: 2, step: 0.05 },
];

const VISUAL_TOGGLES: { key: keyof Pick<GraphVisualSettings, 'showLabels' | 'showEdgeLabels' | 'showParticles' | 'showClusterHulls' | 'showGrid' | 'showStarfield' | 'animateFlow'>; label: string }[] = [
  { key: 'showLabels', label: 'Node labels' },
  { key: 'showEdgeLabels', label: 'Relationship labels' },
  { key: 'showParticles', label: 'Flow particles' },
  { key: 'showClusterHulls', label: 'Cluster hulls' },
  { key: 'showGrid', label: 'Background grid' },
  { key: 'showStarfield', label: 'Starfield' },
  { key: 'animateFlow', label: 'Animate flow' },
];

export function SettingsPanel() {
  const workspace = useActiveWorkspace();
  const layout = workspace.settings.layout;
  const visual = workspace.settings.visual;
  const setLayoutSettings = useGraphStore((state) => state.setLayoutSettings);
  const setSettings = useGraphStore((state) => state.setSettings);
  const clearHistory = useGraphStore((state) => state.clearHistory);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  const canUndo = useGraphStore((state) => state.canUndo());
  const canRedo = useGraphStore((state) => state.canRedo());

  const { theme, accent, animations, accessibility, autoSave, reset, update, updateAccessibility } = useSettingsStore();
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void storageInfo().then((info) => { if (alive) setStorage(info); }).catch(() => { if (alive) setStorage(null); });
    return () => { alive = false; };
  }, []);

  const setLayout = (patch: Partial<GraphLayoutSettings>) => setLayoutSettings(patch);
  const setVisual = (patch: Partial<GraphVisualSettings>) => setSettings({ visual: { ...visual, ...patch } });

  return (
    <Panel title="Settings" subtitle="Layout, appearance and local preferences">
      <div className="space-y-4 p-3">
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Layout forces</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {LAYOUT_SLIDERS.map(({ key, label, min, max, step }) => (
              <Slider key={key} label={label} value={layout[key]} min={min} max={max} step={step} onChange={(value) => setLayout({ [key]: value } as Partial<GraphLayoutSettings>)} display={layout[key].toFixed(step < 1 ? 2 : 0)} />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Toggle label="Layout running" checked={layout.running} onChange={(value) => setLayout({ running: value })} />
            <Button size="sm" variant="ghost" onClick={() => setLayout({ running: !layout.running })}>{layout.running ? 'Pause' : 'Resume'}</Button>
          </div>
        </div>

        <Divider label="Visuals" />
        <div className="space-y-0.5">
          {VISUAL_TOGGLES.map(({ key, label }) => (
            <Toggle key={key} label={label} checked={visual[key]} onChange={(value) => setVisual({ [key]: value } as Partial<GraphVisualSettings>)} />
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-[10px] text-zinc-500">Quality preset</p>
          <SegmentedControl value={visual.quality} onChange={(quality) => setVisual({ quality })} options={[
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
          ]} />
          <Slider label="Node scale" value={visual.nodeScale} min={0.4} max={2.5} step={0.05} onChange={(nodeScale) => setVisual({ nodeScale })} />
          <Slider label="Edge opacity" value={visual.edgeOpacity} min={0.05} max={1} step={0.05} onChange={(edgeOpacity) => setVisual({ edgeOpacity })} />
          <Slider label="Edge curvature" value={visual.edgeCurvature} min={0} max={1} step={0.05} onChange={(edgeCurvature) => setVisual({ edgeCurvature })} />
          <p className="text-[10px] text-zinc-500">Background</p>
          <SegmentedControl value={visual.background} onChange={(background) => setVisual({ background })} options={[
            { value: 'void', label: 'Void' }, { value: 'deep', label: 'Deep' }, { value: 'graphite', label: 'Graphite' },
          ]} />
        </div>

        <Divider label="Appearance" />
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-[10px] text-zinc-500">Theme</p>
            <SegmentedControl value={theme} onChange={(value) => update({ theme: value })} options={[
              { value: 'midnight', label: 'Midnight' }, { value: 'graphite', label: 'Graphite' }, { value: 'obsidian', label: 'Obsidian' },
            ]} />
          </div>
          <div>
            <p className="mb-1 text-[10px] text-zinc-500">Accent</p>
            <SegmentedControl value={accent} onChange={(value) => update({ accent: value })} options={[
              { value: 'cyan', label: 'Cyan' }, { value: 'violet', label: 'Violet' }, { value: 'blue', label: 'Blue' },
            ]} />
          </div>
          <Toggle label="Interface animations" checked={animations} onChange={(value) => update({ animations: value })} />
          <Toggle label="Auto-save" checked={autoSave} onChange={(value) => update({ autoSave: value })} />
        </div>

        <Divider label="Accessibility" />
        <div className="space-y-0.5">
          <Toggle label="Reduced motion" checked={accessibility.reduceMotion} onChange={(value) => updateAccessibility({ reduceMotion: value })} hint="Minimise non-essential transitions and effects" />
          <Toggle label="High contrast" checked={accessibility.highContrast} onChange={(value) => updateAccessibility({ highContrast: value })} />
          <Toggle label="Large text" checked={accessibility.largeText} onChange={(value) => updateAccessibility({ largeText: value })} />
          <Toggle label="Graph summaries" checked={accessibility.screenReaderGraphSummary} onChange={(value) => updateAccessibility({ screenReaderGraphSummary: value })} hint="Describe graph structure for screen readers" />
        </div>

        <Divider label="Storage & history" />
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10px] text-zinc-500">
          <p>Local storage: {storage ? `${formatBytes(storage.usage)} of ${formatBytes(storage.quota)} used` : 'Unavailable in this browser'}</p>
          <p className="mt-1">Auto-save is local-first. Your data stays on this device.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Undo2 size={11} />} onClick={undo} disabled={!canUndo}>Undo</Button>
          <Button size="sm" variant="secondary" icon={<Redo2 size={11} />} onClick={redo} disabled={!canRedo}>Redo</Button>
          <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => { clearHistory(); pushToast({ kind: 'info', title: 'History cleared' }); }}>Clear history</Button>
          <Button size="sm" variant="ghost" icon={<RotateCcw size={11} />} onClick={() => { reset(); pushToast({ kind: 'info', title: 'Preferences reset' }); }}>Reset preferences</Button>
          <Button size="sm" variant="ghost" onClick={() => { update({ showOnboarding: true }); openModal('onboarding'); }}>Replay tour</Button>
        </div>
      </div>
    </Panel>
  );
}
