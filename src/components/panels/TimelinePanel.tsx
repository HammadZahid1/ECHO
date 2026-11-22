import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/controls';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/states';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { KnowledgeEdge, KnowledgeNode } from '@/types';

interface DayGroup {
  start: number;
  key: string;
  label: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isoDay(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function TimelinePanel() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const filters = useGraphStore((state) => state.filters);
  const setFilters = useGraphStore((state) => state.setFilters);
  const openModal = useUIStore((state) => state.openModal);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const days = useMemo<DayGroup[]>(() => {
    const groups = new Map<number, DayGroup>();
    const ensure = (timestamp: number): DayGroup => {
      const start = startOfDay(timestamp);
      let group = groups.get(start);
      if (!group) {
        group = {
          start,
          key: isoDay(start),
          label: new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          nodes: [],
          edges: [],
        };
        groups.set(start, group);
      }
      return group;
    };
    for (const node of graph.nodes) if (Number.isFinite(node.createdAt) && node.createdAt > 0) ensure(node.createdAt).nodes.push(node);
    for (const edge of graph.edges) if (Number.isFinite(edge.createdAt) && edge.createdAt > 0) ensure(edge.createdAt).edges.push(edge);
    return [...groups.values()].sort((a, b) => a.start - b.start);
  }, [graph]);

  const visibleDays = useMemo(
    () => days.filter((day) => (!from || day.key >= from) && (!to || day.key <= to)),
    [days, from, to],
  );

  useEffect(() => {
    if (!playing || visibleDays.length === 0) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = current === null ? 0 : (current + 1) % visibleDays.length;
        return next;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, visibleDays.length]);

  const activeDay = activeIndex === null ? null : visibleDays[activeIndex] ?? null;

  useEffect(() => {
    if (!activeDay) return;
    setFilters({
      ...filters,
      clusterNodeIds: activeDay.nodes.map((node) => node.id),
      query: undefined,
      createdAfter: undefined,
      modifiedAfter: undefined,
    });
    // Filter application is intentionally tied to the selected day only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay?.start]);

  const maxActivity = Math.max(1, ...visibleDays.map((day) => day.nodes.length + day.edges.length));

  const selectDay = (index: number): void => {
    setActiveIndex(index);
    setPlaying(false);
  };

  const clearDay = (): void => {
    setActiveIndex(null);
    setPlaying(false);
    setFilters({ ...filters, clusterNodeIds: null });
  };

  return (
    <Panel title="Timeline" subtitle="Activity by creation date">
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <TextField label="From" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setActiveIndex(null); }} />
          <TextField label="To" type="date" value={to} onChange={(event) => { setTo(event.target.value); setActiveIndex(null); }} />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={playing ? 'primary' : 'secondary'} icon={playing ? <Pause size={11} /> : <Play size={11} />} onClick={() => setPlaying((value) => !value)} disabled={visibleDays.length === 0}>
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" variant="ghost" icon={<RotateCcw size={11} />} onClick={clearDay} disabled={activeIndex === null}>Clear filter</Button>
          <span className="ml-auto font-mono text-[10px] text-zinc-600">{visibleDays.length} day{visibleDays.length === 1 ? '' : 's'}</span>
        </div>

        {visibleDays.length === 0 ? (
          <EmptyState icon={<CalendarDays size={24} strokeWidth={1.2} />} title="No activity in range" description="Adjust the date range or add timestamped nodes and relationships." />
        ) : (
          <div className="space-y-2">
            <div className="flex items-end gap-1 border-b border-white/[0.06] pb-1" style={{ height: 96 }}>
              {visibleDays.map((day, index) => {
                const active = activeIndex === index;
                const total = day.nodes.length + day.edges.length;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => selectDay(index)}
                    title={`${day.label}: ${day.nodes.length} nodes, ${day.edges.length} relationships`}
                    className={`flex h-full min-w-0 flex-1 flex-col justify-end gap-px rounded-t-sm px-px transition-opacity ${active ? 'opacity-100 ring-1 ring-cyan-400/50' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <div className="flex w-full flex-col justify-end" style={{ height: `${(total / maxActivity) * 100}%` }}>
                      {day.edges.length > 0 && <div className="w-full rounded-t-sm bg-violet-400/70" style={{ height: `${(day.edges.length / total) * 100}%` }} />}
                      {day.nodes.length > 0 && <div className="w-full rounded-b-sm bg-cyan-400/70" style={{ height: `${(day.nodes.length / total) * 100}%` }} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-700">
              <span>{visibleDays[0]?.label}</span>
              <span className="flex items-center gap-2"><span className="inline-block h-1.5 w-1.5 bg-cyan-400/70" />nodes <span className="inline-block h-1.5 w-1.5 bg-violet-400/70" />relationships</span>
              <span>{visibleDays[visibleDays.length - 1]?.label}</span>
            </div>
            {activeDay && (
              <div className="rounded border border-cyan-400/20 bg-cyan-400/[0.04] p-2 text-[10px] text-zinc-400">
                <p className="flex items-center gap-1.5 font-medium text-cyan-200"><Clock size={11} />{activeDay.label}</p>
                <p className="mt-1">{activeDay.nodes.length} nodes and {activeDay.edges.length} relationships created · graph filtered to this day.</p>
              </div>
            )}
          </div>
        )}

        <Divider label={`Snapshots (${workspace.snapshots.length})`} />
        {workspace.snapshots.length === 0 ? (
          <p className="text-[11px] text-zinc-600">No snapshots yet. Save one from the Snapshots panel to mark a point in time.</p>
        ) : (
          <div className="space-y-1">
            {[...workspace.snapshots].reverse().map((snapshot) => (
              <button
                key={snapshot.id}
                type="button"
                onClick={() => openModal('compare')}
                className="flex w-full items-center gap-2 rounded border border-white/[0.05] bg-white/[0.02] px-2 py-1.5 text-left hover:border-white/15"
              >
                <Camera size={11} className="shrink-0 text-zinc-600" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{snapshot.name}</span>
                <span className="font-mono text-[9px] text-zinc-600">{new Date(snapshot.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
