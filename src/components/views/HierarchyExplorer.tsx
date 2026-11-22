import { useMemo } from 'react';
import type { GraphData } from '@/types';
import { hierarchicalLayout } from '@/lib/layout/hierarchical';
import { createDefaultSettings } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';

export function HierarchyExplorer({ graph }: { graph: GraphData }) {
  const selectedIds = useGraphStore((state) => state.selectedNodeIds);
  const selectNode = useGraphStore((state) => state.selectNode);
  const settings = useMemo(() => ({ ...createDefaultSettings().layout, kind: 'hierarchical' as const }), []);
  const positions = useMemo(() => hierarchicalLayout({ graph, settings, dimensions: 2 }), [graph, settings]);
  const minY = Math.min(...[...positions.values()].map((position) => position.y), 0);
  const maxY = Math.max(...[...positions.values()].map((position) => position.y), 1);
  const minX = Math.min(...[...positions.values()].map((position) => position.x), 0);
  const maxX = Math.max(...[...positions.values()].map((position) => position.x), 1);
  const px = (x: number): number => 6 + ((x - minX) / Math.max(1, maxX - minX)) * 88;
  const py = (y: number): number => 10 + ((y - minY) / Math.max(1, maxY - minY)) * 78;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#08090b] p-2">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {graph.edges.map((edge) => {
          const a = positions.get(edge.source);
          const b = positions.get(edge.target);
          if (!a || !b) return null;
          return <path key={edge.id} d={`M ${px(a.x)}% ${py(a.y)}% C ${px(a.x)}% ${(py(a.y) + py(b.y)) / 2}%, ${px(b.x)}% ${(py(a.y) + py(b.y)) / 2}%, ${px(b.x)}% ${py(b.y)}%`} fill="none" stroke="#394653" strokeWidth="1" />;
        })}
      </svg>
      {graph.nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => selectNode(node.id)}
            style={{ left: `${px(position.x)}%`, top: `${py(position.y)}%`, borderColor: selectedIds.includes(node.id) ? '#fff' : node.color ?? '#5b8def' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[140px] truncate rounded border bg-[#101317]/95 px-2 py-1 text-[10px] text-zinc-300 hover:z-10 hover:border-white/40"
          >
            {node.title}
          </button>
        );
      })}
    </div>
  );
}
