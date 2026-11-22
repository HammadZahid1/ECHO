import { useMemo, useState } from 'react';
import { ArrowRight, Crosshair, GitBranch, Route, Search } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/controls';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/states';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { findPaths, shortestPath } from '@/lib/graph/pathfinding';
import { RELATIONSHIP_TYPE_INFO } from '@/lib/graph/registry';

export function PathFinderPanel() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [maxLength, setMaxLength] = useState(6);
  const [searched, setSearched] = useState(false);

  const sourceId = from || graph.nodes[0]?.id || '';
  const targetId = to || graph.nodes[1]?.id || '';

  const result = useMemo(() => {
    if (!sourceId || !targetId || sourceId === targetId) return null;
    return findPaths(graph, sourceId, targetId, { maxLength, limit: 5 });
  }, [graph, sourceId, targetId, maxLength]);

  const shortest = useMemo(
    () => (sourceId && targetId && sourceId !== targetId ? shortestPath(graph, sourceId, targetId) : null),
    [graph, sourceId, targetId],
  );

  const titleOf = (id: string): string => graph.nodes.find((node) => node.id === id)?.title ?? id;
  const colorOf = (id: string): string => graph.nodes.find((node) => node.id === id)?.color ?? '#4fd8e8';
  const focus = (id: string): void => { selectNode(id); setFocus(id); };

  return (
    <Panel title="Path finder" subtitle="Trace relationships between concepts">
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Select label="From" value={sourceId} onChange={(event) => { setFrom(event.target.value); setSearched(false); }}>
            <option value="">Select node…</option>
            {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
          </Select>
          <div className="grid h-8 place-items-center text-zinc-700"><ArrowRight size={14} /></div>
          <Select label="To" value={targetId} onChange={(event) => { setTo(event.target.value); setSearched(false); }}>
            <option value="">Select node…</option>
            {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-[10px] text-zinc-600">
            Max hops
            <input
              type="number"
              min={1}
              max={12}
              value={maxLength}
              aria-label="Maximum path length"
              onChange={(event) => { setMaxLength(Math.max(1, Math.min(12, Number(event.target.value) || 1))); setSearched(false); }}
              className="w-14 rounded border border-white/10 bg-black/30 px-1.5 py-1 font-mono text-[11px] text-zinc-300 outline-none focus:border-cyan-400/50"
            />
          </label>
          <Button size="sm" variant="primary" icon={<Search size={11} />} onClick={() => setSearched(true)} disabled={!sourceId || !targetId || sourceId === targetId}>
            Find paths
          </Button>
        </div>

        {!searched ? (
          <EmptyState icon={<Route size={24} strokeWidth={1.2} />} title="Find a route" description="Choose two nodes and trace the shortest or alternative relationship chains between them." />
        ) : !result || !result.found ? (
          <EmptyState
            icon={<GitBranch size={24} strokeWidth={1.2} />}
            title="No path found"
            description={`No simple path of up to ${maxLength} hops connects “${titleOf(sourceId)}” to “${titleOf(targetId)}” in the current graph.`}
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded border border-cyan-400/20 bg-cyan-400/[0.04] p-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300/80"><Crosshair size={11} />Shortest path</p>
              <PathChain path={shortest} titleOf={titleOf} colorOf={colorOf} onNode={focus} />
            </div>

            <Divider label={`${result.paths.length} candidate route${result.paths.length === 1 ? '' : 's'}`} />
            <div className="space-y-2">
              {result.paths.map((path, index) => (
                <div key={`${path.nodeIds.join('>')}-${index}`} className={`rounded border p-2.5 ${index === 0 ? 'border-white/15 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.015]'}`}>
                  <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    <span>Route {index + 1}</span>
                    <span className="font-mono normal-case tracking-normal">{path.length} hops · strength {path.totalStrength.toFixed(2)}</span>
                  </div>
                  <PathChain path={path} titleOf={titleOf} colorOf={colorOf} onNode={focus} />
                </div>
              ))}
            </div>
            <p className="text-[9px] text-zinc-700">Explored {result.explored} states. Click any intermediate node to focus it in the graph.</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function PathChain({
  path, titleOf, colorOf, onNode,
}: {
  path: { nodeIds: string[]; relationshipTypes: string[] } | null;
  titleOf: (id: string) => string;
  colorOf: (id: string) => string;
  onNode: (id: string) => void;
}) {
  if (!path) return <p className="mt-2 text-[11px] text-zinc-600">Unreachable.</p>;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {path.nodeIds.map((nodeId, index) => {
        const intermediate = index > 0 && index < path.nodeIds.length - 1;
        const relation = path.relationshipTypes[index - 1];
        const info = relation ? RELATIONSHIP_TYPE_INFO[relation as keyof typeof RELATIONSHIP_TYPE_INFO] : undefined;
        return (
          <span key={`${nodeId}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <span className="flex flex-col items-center px-0.5" title={info?.label ?? relation}>
                <span className="h-px w-5" style={{ background: info?.color ?? '#3f464f' }} />
                <span className="max-w-[52px] truncate text-[8px] text-zinc-600">{info?.label ?? relation ?? 'related'}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onNode(nodeId)}
              title={intermediate ? 'Focus this node' : titleOf(nodeId)}
              className={`max-w-[110px] truncate rounded border px-1.5 py-0.5 text-[10px] transition-colors ${intermediate ? 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-cyan-400/40' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'}`}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: colorOf(nodeId) }} />
              {titleOf(nodeId)}
            </button>
          </span>
        );
      })}
    </div>
  );
}
