import { useMemo, type ReactNode } from 'react';
import { Activity, CircleDot, GitBranch, Hash, Link2, Tag, TrendingUp } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Divider } from '@/components/ui/Divider';
import { StatTile } from '@/components/ui/states';
import { useActiveWorkspace } from '@/store/graphStore';
import { useGraphStatistics } from '@/hooks/useGraphDerived';
import { degreeMap } from '@/lib/graph/stats';
import type { DistributionBucket } from '@/types';

function DistributionBars({
  title, icon, buckets, emptyLabel,
}: { title: string; icon: ReactNode; buckets: DistributionBucket[]; emptyLabel: string }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{icon}{title}</h3>
      {buckets.length === 0 ? (
        <p className="text-[11px] text-zinc-600">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {buckets.slice(0, 8).map((bucket) => (
            <div key={bucket.key} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="truncate text-zinc-400">{bucket.label}</span>
                <span className="font-mono text-zinc-600">{bucket.count}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(bucket.count / max) * 100}%`, background: bucket.color ?? '#4fd8e8' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnalyticsPanel() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const stats = useGraphStatistics(graph);
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const degrees = useMemo(() => degreeMap(graph), [graph]);

  const growth = useMemo(() => {
    const timestamps = [...graph.nodes, ...graph.edges]
      .map((item) => item.createdAt)
      .filter((value) => Number.isFinite(value) && value > 0);
    if (timestamps.length === 0) return [];
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const count = Math.min(12, Math.max(1, Math.ceil((max - min) / 86_400_000) + 1));
    const width = Math.max(1, (max - min) / count);
    const buckets = Array.from({ length: count }, (_, index) => ({ start: min + index * width, nodes: 0, edges: 0 }));
    for (const node of graph.nodes) {
      const index = Math.min(count - 1, Math.max(0, Math.floor((node.createdAt - min) / width)));
      const bucket = buckets[index];
      if (bucket) bucket.nodes += 1;
    }
    for (const edge of graph.edges) {
      const index = Math.min(count - 1, Math.max(0, Math.floor((edge.createdAt - min) / width)));
      const bucket = buckets[index];
      if (bucket) bucket.edges += 1;
    }
    return buckets.map((bucket) => ({
      ...bucket,
      label: new Date(bucket.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
  }, [graph]);

  const growthMax = Math.max(1, ...growth.map((bucket) => Math.max(bucket.nodes, bucket.edges)));

  return (
    <Panel title="Analytics" subtitle={`${stats.nodeCount} nodes · ${stats.edgeCount} relationships`}>
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Nodes" value={stats.nodeCount} hint={`${stats.typeDistribution.length} types`} accent="#4fd8e8" />
          <StatTile label="Relationships" value={stats.edgeCount} hint={`${stats.relationshipDistribution.length} kinds`} accent="#9d7bf5" />
          <StatTile label="Components" value={stats.clusterCount} hint={`largest ${stats.largestClusterSize}`} accent="#58c9a0" />
          <StatTile label="Density" value={stats.density.toFixed(3)} hint={`avg degree ${stats.averageDegree.toFixed(2)}`} accent="#e3b35c" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Median degree" value={stats.medianDegree.toFixed(1)} />
          <StatTile label="Max degree" value={stats.maxDegree} />
          <StatTile label="Isolated" value={stats.isolatedNodeIds.length} accent={stats.isolatedNodeIds.length ? '#e46d70' : undefined} />
        </div>

        <Divider label="Most connected" />
        {stats.mostConnectedNodeIds.length === 0 ? (
          <p className="text-[11px] text-zinc-600">No relationships yet. Connect nodes to see hubs here.</p>
        ) : (
          <div className="space-y-1">
            {stats.mostConnectedNodeIds.map((nodeId, index) => {
              const node = nodeById.get(nodeId);
              if (!node) return null;
              return (
                <div key={nodeId} className="flex items-center gap-2 rounded border border-white/[0.05] bg-white/[0.02] px-2 py-1.5">
                  <span className="font-mono text-[10px] text-zinc-700">{String(index + 1).padStart(2, '0')}</span>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: node.color ?? '#4fd8e8' }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{node.title}</span>
                  <span className="font-mono text-[10px] text-cyan-300/70">{degrees.get(nodeId) ?? 0}</span>
                </div>
              );
            })}
          </div>
        )}

        <Divider label="Distributions" />
        <div className="space-y-4">
          <DistributionBars title="Node types" icon={<CircleDot size={12} />} buckets={stats.typeDistribution} emptyLabel="No nodes to classify." />
          <DistributionBars title="Relationships" icon={<GitBranch size={12} />} buckets={stats.relationshipDistribution} emptyLabel="No relationships to classify." />
          <DistributionBars title="Tags" icon={<Tag size={12} />} buckets={stats.tagDistribution} emptyLabel="Add tags to nodes to see this breakdown." />
          <DistributionBars title="Degree" icon={<Link2 size={12} />} buckets={stats.degreeDistribution} emptyLabel="No degree data." />
        </div>

        <Divider label="Growth by creation date" />
        {growth.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[11px] text-zinc-600"><Activity size={13} />No timestamped items yet.</div>
        ) : (
          <div className="space-y-2">
            <div className="flex h-16 items-end gap-1 border-b border-white/[0.06] pb-1">
              {growth.map((bucket, index) => (
                <div key={`${bucket.start}-${index}`} className="flex h-full min-w-0 flex-1 items-end gap-px" title={`${bucket.label}: ${bucket.nodes} nodes, ${bucket.edges} relationships`}>
                  <div className="w-1/2 rounded-t-sm bg-cyan-400/60" style={{ height: `${(bucket.nodes / growthMax) * 100}%` }} />
                  <div className="w-1/2 rounded-t-sm bg-violet-400/60" style={{ height: `${(bucket.edges / growthMax) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-700">
              <span>{growth[0]?.label}</span>
              <span className="flex items-center gap-2"><Hash size={9} /> nodes <TrendingUp size={9} /> relationships</span>
              <span>{growth[growth.length - 1]?.label}</span>
            </div>
          </div>
        )}

        <p className="border-t border-white/[0.05] pt-2 text-[9px] leading-relaxed text-zinc-700">
          All figures are recomputed from the live graph on every change. Growth buckets are derived from node and relationship creation timestamps.
        </p>
      </div>
    </Panel>
  );
}
