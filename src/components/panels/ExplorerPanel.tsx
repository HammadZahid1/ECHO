import { useMemo, useState, type MouseEvent } from 'react';
import { Compass, GitBranch, Hash, Route } from 'lucide-react';
import type { NodeType } from '@/types';
import { NODE_TYPES } from '@/types';
import { NODE_TYPE_INFO, importanceLabel } from '@/lib/graph/registry';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { collectAllTags } from '@/lib/graph/filters';
import { computeStatistics } from '@/lib/graph/stats';
import { neighborhood } from '@/lib/graph/traverse';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Select, Slider } from '@/components/ui/controls';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/states';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

type ExploreMode = 'universe' | '1-hop' | '2-hop' | '3-hop' | 'isolated' | 'hubs';
type DateFilter = 'any' | 'created-7d' | 'created-30d' | 'modified-7d' | 'modified-30d';

const MODES: { value: ExploreMode; label: string }[] = [
  { value: 'universe', label: 'Universe' },
  { value: '1-hop', label: '1-hop' },
  { value: '2-hop', label: '2-hop' },
  { value: '3-hop', label: '3-hop' },
  { value: 'isolated', label: 'Isolated' },
  { value: 'hubs', label: 'Hubs' },
];

const DAY = 86_400_000;

export function ExplorerPanel() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const focusedNodeId = useGraphStore((state) => state.focusedNodeId);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);

  const [mode, setMode] = useState<ExploreMode>('universe');
  const [typeFilter, setTypeFilter] = useState<NodeType | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [minImportance, setMinImportance] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');

  const stats = useMemo(() => computeStatistics(graph), [graph]);
  const adjacency = useMemo(() => buildAdjacency(graph), [graph]);
  const tagCounts = useMemo(() => collectAllTags(graph), [graph]);
  const centerId = selectedNodeIds[0] ?? focusedNodeId ?? stats.mostConnectedNodeIds[0] ?? graph.nodes[0]?.id ?? null;
  const centerNode = graph.nodes.find((node) => node.id === centerId) ?? null;
  const hops = useMemo(() => centerId ? neighborhood(graph, centerId, 3) : null, [graph, centerId]);
  const depthByNode = useMemo(() => {
    const map = new Map<string, number>();
    hops?.byDepth.forEach((level, depth) => level.forEach((id) => map.set(id, depth)));
    return map;
  }, [hops]);
  const depth = mode.endsWith('-hop') ? Number(mode[0]) : 3;

  const cutoff = dateFilter === 'any'
    ? null
    : Date.now() - Number.parseInt(dateFilter.split('-')[1] ?? '0', 10) * DAY;
  const results = useMemo(() => {
    const scoped = new Set<string>(
      mode === 'universe' ? graph.nodes.map((node) => node.id)
        : mode === 'isolated' ? stats.isolatedNodeIds
          : mode === 'hubs' ? stats.mostConnectedNodeIds
            : hops ? hops.nodeIds.filter((id) => (depthByNode.get(id) ?? 99) <= depth)
              : graph.nodes.map((node) => node.id),
    );
    return graph.nodes
      .filter((node) => {
        if (!scoped.has(node.id)) return false;
        if (typeFilter !== 'all' && node.type !== typeFilter) return false;
        if (activeTags.length > 0 && !activeTags.some((tag) => node.tags.includes(tag))) return false;
        if (node.importance < minImportance) return false;
        if (cutoff !== null) {
          const timestamp = dateFilter.startsWith('created') ? node.createdAt : node.updatedAt;
          if (timestamp < cutoff) return false;
        }
        return true;
      })
      .sort((a, b) => b.importance - a.importance || a.title.localeCompare(b.title));
  }, [graph, mode, stats, hops, depthByNode, depth, typeFilter, activeTags, minImportance, cutoff, dateFilter]);

  const handleSelect = (id: string, event: MouseEvent): void => {
    selectNode(id, event.shiftKey);
    setFocus(id);
  };

  const selectedSet = new Set(selectedNodeIds);
  const hasFilters = typeFilter !== 'all' || activeTags.length > 0 || minImportance > 0 || dateFilter !== 'any';

  return (
    <Panel
      title="Explorer"
      subtitle={`${results.length}/${graph.nodes.length} nodes · ${stats.clusterCount} clusters`}
      actions={<Compass size={13} className="text-zinc-600" />}
    >
      <div className="space-y-3 border-b border-white/[0.06] p-3">
        <Select label="Exploration mode" value={mode} onChange={(event) => setMode(event.target.value as ExploreMode)}>
          {MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>

        {hops && centerNode && mode.endsWith('-hop') ? (
          <div className="space-y-2 rounded border border-white/[0.06] bg-white/[0.02] p-2">
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              <button type="button" onClick={() => selectNode(centerNode.id)} className="max-w-[130px] truncate rounded bg-cyan-400/10 px-1.5 py-0.5 text-cyan-200 hover:bg-cyan-400/20" title={centerNode.title}>
                {centerNode.title}
              </button>
              {hops.byDepth.slice(1).map((level, index) => (
                <span key={index} className="flex items-center gap-1">
                  <span className="text-zinc-700">/</span>
                  <button
                    type="button"
                    disabled={level.length === 0}
                    onClick={() => setMode(`${index + 1}-hop` as ExploreMode)}
                    className={`rounded px-1.5 py-0.5 transition-colors disabled:opacity-30 ${depth === index + 1 ? 'bg-white/10 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
                  >
                    {index + 1} · {level.length}
                  </button>
                </span>
              ))}
            </div>
            <SegmentedControl
              options={[{ value: '1', label: '1-hop' }, { value: '2', label: '2-hop' }, { value: '3', label: '3-hop' }]}
              value={String(depth)}
              onChange={(value) => setMode(`${value}-hop` as ExploreMode)}
              className="w-full"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Select label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NodeType | 'all')}>
            <option value="all">All types</option>
            {NODE_TYPES.map((type) => <option key={type} value={type}>{NODE_TYPE_INFO[type].label}</option>)}
          </Select>
          <Select label="Date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
            <option value="any">Any time</option>
            <option value="created-7d">Created 7d</option>
            <option value="created-30d">Created 30d</option>
            <option value="modified-7d">Edited 7d</option>
            <option value="modified-30d">Edited 30d</option>
          </Select>
        </div>
        <Slider
          label="Minimum importance"
          value={minImportance}
          min={0}
          max={1}
          step={0.05}
          display={minImportance === 0 ? 'any' : importanceLabel(minImportance)}
          onChange={setMinImportance}
        />
        <div className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500"><Hash size={10} /> Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {tagCounts.length === 0 && <span className="text-[11px] text-zinc-600">No tags in this universe.</span>}
            {tagCounts.map(({ tag, count }) => (
              <Chip
                key={tag}
                label={tag}
                count={count}
                selected={activeTags.includes(tag)}
                onSelect={() => setActiveTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}
              />
            ))}
          </div>
        </div>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={() => { setTypeFilter('all'); setActiveTags([]); setMinImportance(0); setDateFilter('any'); }}>Clear filters</Button>
        )}
      </div>

      <div className="divide-y divide-white/[0.04]">
        {results.length === 0 && (
          <EmptyState
            icon={<Route size={24} strokeWidth={1.2} />}
            title="Nothing in this view"
            description="Change exploration mode or relax the filters to see more knowledge."
          />
        )}
        {results.map((node) => {
          const info = NODE_TYPE_INFO[node.type];
          const degree = adjacency.degree.get(node.id) ?? 0;
          const active = selectedSet.has(node.id);
          return (
            <button
              key={node.id}
              type="button"
              onClick={(event) => handleSelect(node.id, event)}
              className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${active ? 'bg-cyan-400/[0.09]' : 'hover:bg-white/[0.04]'}`}
            >
              <span className="mt-0.5 text-[13px] leading-none" style={{ color: info.color }}>{info.glyph}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[11px] ${active ? 'text-cyan-100' : 'text-zinc-300'}`}>{node.title}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-zinc-600">
                  <GitBranch size={9} /> {degree}
                  <span>·</span> {importanceLabel(node.importance)}
                  {node.tags.slice(0, 2).map((tag) => <span key={tag}>#{tag}</span>)}
                </span>
              </span>
              {mode.endsWith('-hop') && depthByNode.has(node.id) && (
                <span className="font-mono text-[9px] text-zinc-700">d{depthByNode.get(node.id)}</span>
              )}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export default ExplorerPanel;
