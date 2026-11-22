import type { GraphData } from '@/types';
import type { LayoutOptions, PositionMap } from './types';
import { hierarchicalLayout } from './hierarchical';

interface TreeNode {
  id: string;
  children: TreeNode[];
}

/** Builds a forest from directed containment/influence edges. */
export function buildTree(graph: GraphData): TreeNode[] {
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.directed && edge.source !== edge.target) {
      children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
      hasParent.add(edge.target);
    }
  }
  const ids = new Set(graph.nodes.map((node) => node.id));
  const roots = graph.nodes.filter((node) => !hasParent.has(node.id)).map((node) => node.id);
  const build = (id: string, ancestors: Set<string>): TreeNode => {
    const childIds = (children.get(id) ?? []).filter((child) => ids.has(child) && !ancestors.has(child));
    const nextAncestors = new Set(ancestors).add(id);
    return { id, children: childIds.map((child) => build(child, nextAncestors)) };
  };
  return (roots.length > 0 ? roots : [...ids]).map((id) => build(id, new Set()));
}

/** Tidy-enough tree layout with recursive subtree centering. */
export function treeLayout(options: LayoutOptions): PositionMap {
  const { graph, dimensions = 2, radius = 16 } = options;
  const positions: PositionMap = new Map();
  if (graph.nodes.length === 0) return positions;
  const roots = buildTree(graph);
  const maxDepth = 12;

  const place = (node: TreeNode, depth: number): number => {
    if (depth > maxDepth) return 0;
    if (node.children.length === 0) {
      const leafIndex = positions.size;
      positions.set(node.id, {
        x: 0,
        y: dimensions === 2 ? -depth * radius : -depth * radius * 0.6,
        z: 0,
      });
      return leafIndex;
    }
    const childIndices = node.children.map((child) => place(child, depth + 1));
    const average = childIndices.reduce((sum, value) => sum + value, 0) / childIndices.length;
    const position = positions.get(node.id);
    if (position) position.x = average * radius;
    else positions.set(node.id, {
      x: average * radius,
      y: dimensions === 2 ? -depth * radius : -depth * radius * 0.6,
      z: 0,
    });
    return average;
  };

  let offset = 0;
  for (const root of roots) {
    const before = positions.size;
    place(root, 0);
    const count = positions.size - before;
    for (let i = before; i < positions.size; i += 1) {
      const entry = [...positions.entries()][i];
      if (!entry) continue;
      const position = entry[1];
      position.x += offset;
    }
    offset += count * radius;
  }

  // Fallback for any node missed by the forest (cycles with no roots).
  for (const node of graph.nodes) {
    if (!positions.has(node.id)) positions.set(node.id, { x: offset, y: 0, z: 0 });
    offset += radius;
  }
  return positions;
}

/** Alias using a different offset strategy for shallow hierarchies. */
export function forestLayout(options: LayoutOptions): PositionMap {
  return hierarchicalLayout(options);
}
