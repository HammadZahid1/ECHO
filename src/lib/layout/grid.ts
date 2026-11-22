import type { PositionMap } from './types';

/** Deterministic square-ish grid, ordered by importance then title. */
export function gridLayout(options: LayoutOptions): PositionMap {
  const { graph, dimensions = 2, radius = 14 } = options;
  const positions: PositionMap = new Map();
  const nodes = [...graph.nodes].sort((a, b) => b.importance - a.importance || a.title.localeCompare(b.title));
  if (nodes.length === 0) return positions;
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / columns);
  nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions.set(node.id, {
      x: (column - (columns - 1) / 2) * radius,
      y: dimensions === 2 ? (row - (rows - 1) / 2) * radius : 0,
      z: dimensions === 2 ? 0 : (row - (rows - 1) / 2) * radius,
    });
  });
  return positions;
}
