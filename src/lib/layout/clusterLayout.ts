import type { LayoutOptions, PositionMap } from './types';
import { componentClusters } from '@/lib/graph/clusters';
import { seededRandom } from '@/lib/utils/math';

/** Packs detected clusters into separated islands. */
export function clusterLayout(options: LayoutOptions): PositionMap {
  const { graph, dimensions = 2, radius = 20, seed = 11 } = options;
  const positions: PositionMap = new Map();
  const clusters = componentClusters(graph).clusters.filter((cluster) => cluster.nodeIds.length > 0);
  if (clusters.length === 0) return positions;
  const random = seededRandom(seed + clusters.length);
  const columns = Math.ceil(Math.sqrt(clusters.length));
  const islandRadius = radius * 2.2;

  clusters.forEach((cluster, clusterIndex) => {
    const column = clusterIndex % columns;
    const row = Math.floor(clusterIndex / columns);
    const centerX = (column - (columns - 1) / 2) * islandRadius;
    const centerY = (row - (Math.ceil(clusters.length / columns) - 1) / 2) * islandRadius;
    cluster.nodeIds.forEach((id, index) => {
      const angle = (index / cluster.nodeIds.length) * Math.PI * 2;
      const distance = cluster.nodeIds.length === 1 ? 0 : radius * Math.sqrt(index / cluster.nodeIds.length);
      positions.set(id, {
        x: centerX + Math.cos(angle) * distance + (random() - 0.5) * 1.5,
        y: dimensions === 2 ? centerY + Math.sin(angle) * distance : (random() - 0.5) * 6,
        z: dimensions === 2 ? 0 : centerY + Math.sin(angle) * distance,
      });
    });
  });
  return positions;
}
