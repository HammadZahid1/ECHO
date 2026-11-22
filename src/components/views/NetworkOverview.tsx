import { useMemo } from 'react';
import { Activity, Circle, GitBranch, Link2, Network, Share2 } from 'lucide-react';
import type { GraphData, GraphStatistics } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { degreeMap } from '@/lib/graph/stats';
import { useGraphStore } from '@/store/graphStore';

interface Props {
  graph: GraphData;
  statistics: GraphStatistics;
}

export function NetworkOverview({ graph, statistics }: Props) {
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);
  const degrees = useMemo(() => degreeMap(graph), [graph]);
  const hubs = useMemo(() => statistics.mostConnectedNodeIds
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .slice(0, 12), [graph, statistics.mostConnectedNodeIds]);
  const maxType = Math.max(1, ...statistics.typeDistribution.map((bucket) => bucket.count));
  const items = [
    { icon: <Circle size={13} />, label: 'Knowledge nodes', value: statistics.nodeCount.toString(), accent: '#4fd8e8' },
    { icon: <Link2 size={13} />, label: 'Relationships', value: statistics.edgeCount.toString(), accent: '#9d7bf5' },
    { icon: <GitBranch size={13} />, label: 'Connected components', value: statistics.componentCount.toString(), accent: '#e3b35c' },
    { icon: <Share2 size={13} />, label: 'Average degree', value: statistics.averageDegree.toFixed(2), accent: '#68d391' },
    { icon: <Network size={13} />, label: 'Graph density', value: `${(statistics.density * 100).toFixed(1)}%`, accent: '#f687b3' },
    { icon: <Activity size={13} />, label: 'Isolated nodes', value: statistics.isolatedNodeIds.length.toString(), accent: '#fc8181' },
  ];

  return (
    <div className="h-full w-full overflow-auto bg-[#08090b] p-5">
      <header className="mb-5">
        <h1 className="text-sm text-zinc-200">Network overview</h1>
        <p className="mt-1 text-[11px] text-zinc-600">Live metrics computed from the currently visible knowledge graph.</p>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {items.map((item) => (
          <article key={item.label} className="border border-white/[0.07] bg-white/[0.015] p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-zinc-600" style={{ color: item.accent }}>{item.icon}<span className="text-zinc-500">{item.label}</span></div>
            <p className="mt-2 font-mono text-xl text-zinc-100">{item.value}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="border border-white/[0.07] bg-white/[0.015] p-4">
          <h2 className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Node types</h2>
          <div className="mt-3 space-y-2">
            {statistics.typeDistribution.map((bucket) => (
              <div key={bucket.key} className="flex items-center gap-3">
                <span className="w-20 truncate text-[10px]" style={{ color: NODE_TYPE_INFO[bucket.key as keyof typeof NODE_TYPE_INFO]?.color ?? '#8b949e' }}>{bucket.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded bg-white/[0.05]"><span className="block h-full rounded" style={{ width: `${(bucket.count / maxType) * 100}%`, background: NODE_TYPE_INFO[bucket.key as keyof typeof NODE_TYPE_INFO]?.color ?? '#4fd8e8' }} /></span>
                <span className="w-6 text-right font-mono text-[10px] text-zinc-600">{bucket.count}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-white/[0.07] bg-white/[0.015] p-4">
          <h2 className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Most connected</h2>
          <ul className="mt-3 space-y-1.5">
            {hubs.map((node) => {
              const degree = degrees.get(node.id);
              return (
                <li key={node.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => { selectNode(node.id); setFocus(node.id); }} className="flex-1 truncate text-left text-[11px] text-zinc-400 hover:text-cyan-200">{node.title}</button>
                  <span className="font-mono text-[10px] text-zinc-600">{degree ?? '—'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
