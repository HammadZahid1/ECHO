import { useMemo } from 'react';
import type { GraphData } from '@/types';
import { labelPropagationClusters } from '@/lib/graph/clusters';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';

export function ClusterExplorer({ graph }: { graph: GraphData }) {
  const clusters = useMemo(() => labelPropagationClusters(graph).clusters, [graph]);
  const selectNodes = useGraphStore((state) => state.selectNodes);
  const setFilters = useGraphStore((state) => state.setFilters);
  const setFocus = useGraphStore((state) => state.setFocus);
  const pushToast = useUIStore((state) => state.pushToast);

  return (
    <div className="h-full w-full overflow-auto bg-[#08090b] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Knowledge clusters</h1>
          <p className="mt-1 text-[11px] text-zinc-600">Detected with deterministic label propagation over the local graph.</p>
        </div>
        <span className="font-mono text-xs text-cyan-300">{clusters.length} communities</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clusters.map((cluster) => (
          <article key={cluster.id} className="border border-white/[0.08] bg-white/[0.015] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: cluster.color }} />
              <h2 className="flex-1 truncate text-xs text-zinc-200">{cluster.name}</h2>
              <span className="font-mono text-[10px] text-zinc-600">{cluster.size}n / {(cluster.density * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.keywords.slice(0, 5).map((keyword) => (
                <span key={keyword} className="rounded border border-white/[0.06] px-1.5 py-0.5 text-[9px] text-zinc-500">{keyword}</span>
              ))}
            </div>
            <ul className="mt-3 space-y-1">
              {cluster.nodeIds.slice(0, 7).map((id) => {
                const node = graph.nodes.find((item) => item.id === id);
                return node ? <li key={id} className="truncate text-[10px] text-zinc-500">· {node.title}</li> : null;
              })}
            </ul>
            <div className="mt-3 flex gap-1.5">
              <button type="button" onClick={() => { selectNodes(cluster.nodeIds); setFocus(cluster.nodeIds[0]); }} className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-100">Select</button>
              <button type="button" onClick={() => { setFilters({ clusterNodeIds: cluster.nodeIds }); pushToast({ kind: 'info', title: 'Cluster filter applied' }); }} className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-100">Focus view</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
