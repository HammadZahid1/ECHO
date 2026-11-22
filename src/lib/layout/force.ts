import type { Vec3 } from '@/types';
import type { GraphData, GraphLayoutSettings } from '@/types';
import type { PositionMap, SimulationNode } from './types';
import { clamp } from '@/lib/utils/math';

export interface ForceStepOptions {
  graph: GraphData;
  settings: GraphLayoutSettings;
  nodes: SimulationNode[];
  delta?: number;
  seed?: number;
}

function cellKey(x: number, y: number, z: number, size: number): string {
  return `${Math.floor(x / size)}|${Math.floor(y / size)}|${Math.floor(z / size)}`;
}

/** Single force-directed integration step; pure with respect to inputs except node state. */
export function forceStep(options: ForceStepOptions): number {
  const { graph, settings, nodes } = options;
  const delta = clamp(options.delta ?? 1, 0.1, 3) * settings.speed;
  const index = new Map<string, SimulationNode>(nodes.map((node) => [node.id, node]));
  const cellSize = Math.max(8, settings.linkDistance * 1.6);
  const grid = new Map<string, SimulationNode[]>();
  for (const node of nodes) {
    const key = cellKey(node.position.x, node.position.y, node.position.z, cellSize);
    const bucket = grid.get(key);
    if (bucket) bucket.push(node);
    else grid.set(key, [node]);
  }

  // Repulsion from nearby spatial cells only (approximation that keeps large graphs responsive).
  for (const node of nodes) {
    const cx = Math.floor(node.position.x / cellSize);
    const cy = Math.floor(node.position.y / cellSize);
    const cz = Math.floor(node.position.z / cellSize);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const bucket = grid.get(`${cx + dx}|${cy + dy}|${cz + dz}`);
          if (!bucket) continue;
          for (const other of bucket) {
            if (other === node) continue;
            const ox = node.position.x - other.position.x;
            const oy = node.position.y - other.position.y;
            const oz = node.position.z - other.position.z;
            const distanceSq = ox * ox + oy * oy + oz * oz + 0.01;
            if (distanceSq > cellSize * cellSize * 4) continue;
            const force = (settings.repulsion * settings.strength) / distanceSq;
            const distance = Math.sqrt(distanceSq);
            node.velocity.x += (ox / distance) * force * delta;
            node.velocity.y += (oy / distance) * force * delta;
            node.velocity.z += (oz / distance) * force * delta;
          }
        }
      }
    }
  }

  // Edge attraction with spring behavior.
  for (const edge of graph.edges) {
    const source = index.get(edge.source);
    const target = index.get(edge.target);
    if (!source || !target) continue;
    const dx = target.position.x - source.position.x;
    const dy = target.position.y - source.position.y;
    const dz = target.position.z - source.position.z;
    const distance = Math.hypot(dx, dy, dz) || 0.001;
    const desired = settings.linkDistance * (1.2 - edge.strength * 0.4);
    const force = (distance - desired) * settings.attraction * settings.strength * edge.strength;
    const nx = (dx / distance) * force * delta;
    const ny = (dy / distance) * force * delta;
    const nz = (dz / distance) * force * delta;
    source.velocity.x += nx;
    source.velocity.y += ny;
    source.velocity.z += nz;
    target.velocity.x -= nx;
    target.velocity.y -= ny;
    target.velocity.z -= nz;
  }

  // Center gravity, damping, collision separation and integration.
  let movement = 0;
  for (const node of nodes) {
    node.velocity.x -= node.position.x * settings.gravity * delta;
    node.velocity.y -= node.position.y * settings.gravity * delta;
    node.velocity.z -= node.position.z * settings.gravity * delta;

    const speed = Math.hypot(node.velocity.x, node.velocity.y, node.velocity.z);
    if (speed > 12) {
      const scale = 12 / speed;
      node.velocity.x *= scale;
      node.velocity.y *= scale;
      node.velocity.z *= scale;
    }
    node.velocity.x *= settings.damping;
    node.velocity.y *= settings.damping;
    node.velocity.z *= settings.damping;

    if (!node.pinned) {
      node.position.x += node.velocity.x * delta;
      node.position.y += node.velocity.y * delta;
      node.position.z += node.velocity.z * delta;
      movement += Math.abs(node.velocity.x) + Math.abs(node.velocity.y) + Math.abs(node.velocity.z);
    }
  }

  // Collision resolution after integration to prevent overlapping nodes.
  if (settings.collision > 0) {
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dz = b.position.z - a.position.z;
        const minDistance = settings.collision * ((a.mass + b.mass) / 2);
        const distanceSq = dx * dx + dy * dy + dz * dz;
        if (distanceSq >= minDistance * minDistance || distanceSq < 0.0001) continue;
        const distance = Math.sqrt(distanceSq);
        const push = ((minDistance - distance) / distance) * 0.5;
        if (!a.pinned) {
          a.position.x -= dx * push;
          a.position.y -= dy * push;
          a.position.z -= dz * push;
        }
        if (!b.pinned) {
          b.position.x += dx * push;
          b.position.y += dy * push;
          b.position.z += dz * push;
        }
      }
    }
  }

  return movement / Math.max(1, nodes.length);
}

export function positionsFromNodes(nodes: SimulationNode[]): PositionMap {
  return new Map(nodes.map((node) => [node.id, { ...node.position }]));
}

export function vecFromPosition(position: Vec3): Vec3 {
  return { x: position.x, y: position.y, z: position.z };
}
