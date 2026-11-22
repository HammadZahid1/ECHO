import type { LayoutKind, GraphData, Vec3 } from '@/types';
import type { LayoutFunction, LayoutOptions, PositionMap } from './types';
import { radialLayout } from './radial';
import { circularLayout } from './circular';
import { hierarchicalLayout } from './hierarchical';
import { treeLayout } from './tree';
import { gridLayout } from './grid';
import { clusterLayout } from './clusterLayout';
import { organicLayout } from './organic';

export * from './types';
export * from './force';
export * from './simulation';
export * from './radial';
export * from './circular';
export * from './hierarchical';
export * from './tree';
export * from './grid';
export * from './clusterLayout';
export * from './organic';

export const LAYOUT_FUNCTIONS: Record<Exclude<LayoutKind, 'force'>, LayoutFunction> = {
  radial: radialLayout,
  circular: circularLayout,
  hierarchical: hierarchicalLayout,
  tree: treeLayout,
  grid: gridLayout,
  cluster: clusterLayout,
  organic: organicLayout,
};

/** Computes deterministic positions for non-physics layouts. */
export function computeLayout(options: LayoutOptions): PositionMap {
  const { settings } = options;
  if (settings.kind === 'force') return new Map(options.graph.nodes.map((node) => [node.id, { ...node.position }]));
  return LAYOUT_FUNCTIONS[settings.kind](options);
}

/** Applies computed positions onto graph nodes (without mutating the input). */
export function withLayoutPositions(graph: GraphData, positions: PositionMap): GraphData {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const position = positions.get(node.id);
      return position ? { ...node, position: { ...position } } : node;
    }),
  };
}

export function averagePosition(positions: Vec3[]): Vec3 {
  if (positions.length === 0) return { x: 0, y: 0, z: 0 };
  const total = positions.reduce(
    (sum, position) => ({ x: sum.x + position.x, y: sum.y + position.y, z: sum.z + position.z }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: total.x / positions.length,
    y: total.y / positions.length,
    z: total.z / positions.length,
  };
}
