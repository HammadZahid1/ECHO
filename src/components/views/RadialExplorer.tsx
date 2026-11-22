import { useMemo } from 'react';
import type { GraphData } from '@/types';
import { radialLayout } from '@/lib/layout/radial';
import { createDefaultSettings } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';

export function RadialExplorer({ graph }: { graph: GraphData }) {
  const focusNodeId = useGraphStore((state) => state.focusedNodeId);
  const selectedIds = useGraphStore((state) => state.selectedNodeIds);
  const selectNode = useGraphStore((state) => state.selectNode);
  const settings = useMemo(() => ({ ...createDefaultSettings().layout, kind: 'radial' as const }), []);
  const positions = useMemo(() => radialLayout({ graph, settings, focusNodeId, radius: 34, dimensions: 2 }), [graph, focusNodeId, settings]);
  const center = positions.get(focusNodeId ?? graph.nodes[0]?.id ?? '') ?? { x: 0, y: 0, z: 0 };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_center,#11161b_0%,#08090b_65%)]">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {graph.edges.map((edge) => {
          const a = positions.get(edge.source);
          const b = positions.get(edge.target);
          if (!a || !b) return null;
          return <line key={edge.id} x1={`${50 + a.x * 0.9}%`} y1={`${50 + a.z * 0.8}%`} x2={`${50 + b.x * 0.9}%`} y2={`${50 + b.z * 0.8}%`} stroke="#3d4a56" strokeOpacity="0.5" strokeWidth="1" />;
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
      {graph.nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const selected = selectedIds.includes(node.id);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => selectNode(node.id)}
            title={node.title}
            style={{ left: `${50 + position.x * 0.9}%`, top: `${50 + position.z * 0.8}%`, borderColor: selected ? '#ffffff' : node.color ?? '#4fd8e8' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-[#0d1013] px-2 py-1 text-[10px] text-zinc-300 shadow-lg transition-transform hover:z-10 hover:scale-110 ${selected ? 'z-10' : ''}`}
          >
            {node.title.length > 22 ? `${node.title.slice(0, 21)}…` : node.title}
          </button>
        );
      })}
      <div className="absolute bottom-4 left-4 rounded border border-white/[0.08] bg-black/40 px-3 py-2 text-[10px] text-zinc-500">
        Center: {graph.nodes.find((node) => node.id === (focusNodeId ?? graph.nodes[0]?.id))?.title ?? '—'}
        {center && <span className="ml-2 font-mono text-zinc-700">({center.x.toFixed(0)}, {center.z.toFixed(0)})</span>}
      </div>
    </div>
  );
}
