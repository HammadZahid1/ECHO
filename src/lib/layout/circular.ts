import type { PositionMap } from './types';

/** Evenly spaced nodes on a single circle (or ringed spiral for large graphs). */
export function circularLayout(options: LayoutOptions): PositionMap {
  const { graph, radius = 36, dimensions = 2 } = options;
  const positions: PositionMap = new Map();
  const nodes = graph.nodes;
  if (nodes.length === 0) return positions;
  const perRing = nodes.length <= 24 ? nodes.length : Math.ceil(nodes.length / Math.ceil(nodes.length / 24));
  let index = 0;
  let ring = 0;
  while (index < nodes.length) {
    const onRing = Math.min(perRing, nodes.length - index);
    const ringRadius = radius * (1 + ring * 0.35);
    for (let i = 0; i < onRing; i += 1) {
      const angle = (i / onRing) * Math.PI * 2 - Math.PI / 2;
      positions.set(nodes[index].id, {
        x: Math.cos(angle) * ringRadius,
        y: dimensions === 2 ? Math.sin(angle) * ringRadius : 0,
        z: dimensions === 2 ? 0 : Math.sin(angle) * ringRadius,
      });
      index += 1;
    }
    ring += 1;
  }
  return positions;
}
