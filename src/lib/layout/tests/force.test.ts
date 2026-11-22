import { describe, expect, it } from 'vitest';
import { forceStep, positionsFromNodes, vecFromPosition } from '@/lib/layout/force';
import { createDefaultSettings, createEdge, createGraphData } from '@/lib/graph/factory';
import type { GraphLayoutSettings } from '@/types';
import type { SimulationNode } from '@/lib/layout/types';

function forceSettings(overrides: Partial<GraphLayoutSettings> = {}): GraphLayoutSettings {
  return {
    ...createDefaultSettings().layout,
    kind: 'force',
    repulsion: 0,
    attraction: 0.5,
    linkDistance: 16,
    gravity: 0,
    damping: 0.9,
    collision: 0,
    strength: 1,
    speed: 1,
    running: true,
    focusNodeId: null,
    ...overrides,
  };
}

function simNode(id: string, x: number, y = 0, z = 0, pinned = false): SimulationNode {
  return {
    id,
    position: { x, y, z },
    velocity: { x: 0, y: 0, z: 0 },
    pinned,
    mass: 1,
  };
}

function isFiniteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('forceStep', () => {
  it('pulls linked nodes together while keeping velocities and positions finite', () => {
    const graph = createGraphData();
    graph.edges.push(createEdge('a', 'b', { id: 'e1', strength: 1 }));
    const nodes = [simNode('a', -50), simNode('b', 50)];
    const before = Math.abs(nodes[1].position.x - nodes[0].position.x);

    for (let i = 0; i < 8; i += 1) {
      const movement = forceStep({ graph, settings: forceSettings(), nodes });
      expect(Number.isFinite(movement)).toBe(true);
      expect(movement).toBeGreaterThanOrEqual(0);
    }

    const after = Math.abs(nodes[1].position.x - nodes[0].position.x);
    expect(after).toBeLessThan(before);
    expect(nodes.every((node) => isFiniteVec(node.position))).toBe(true);
    expect(nodes.every((node) => isFiniteVec(node.velocity))).toBe(true);
  });

  it('never integrates a pinned node but still moves unpinned nodes', () => {
    const graph = createGraphData();
    const nodes = [simNode('pinned', 5, 1, -2, true), simNode('free', -5)];
    const pinnedBefore = { ...nodes[0].position };
    const freeBefore = nodes[1].position.x;

    for (let i = 0; i < 6; i += 1) {
      forceStep({ graph, settings: forceSettings({ gravity: 0.02 }), nodes });
    }

    expect(nodes[0].position).toEqual(pinnedBefore);
    expect(nodes[1].position.x).not.toBe(freeBefore);
    expect(Math.abs(nodes[1].position.x)).toBeLessThan(Math.abs(freeBefore));
    expect(isFiniteVec(nodes[0].velocity)).toBe(true);
  });

  it('is deterministic for identical seeded inputs', () => {
    const graph = createGraphData();
    graph.edges.push(createEdge('a', 'b', { id: 'e1' }));

    const run = (): SimulationNode[] => {
      const nodes = [simNode('a', -20, 3), simNode('b', 20, -3)];
      for (let i = 0; i < 5; i += 1) {
        forceStep({ graph, settings: forceSettings({ gravity: 0.01 }), nodes, delta: 1, seed: 3 });
      }
      return nodes;
    };

    expect(run()).toEqual(run());
  });

  it('separates nearly coincident nodes when collision is enabled', () => {
    const graph = createGraphData();
    const nodes = [simNode('a', 0), simNode('b', 0.01)];
    const before = Math.abs(nodes[1].position.x - nodes[0].position.x);

    forceStep({ graph, settings: forceSettings({ collision: 5 }), nodes });

    expect(Math.abs(nodes[1].position.x - nodes[0].position.x)).toBeGreaterThan(before);
    expect(isFiniteVec(nodes[0].position)).toBe(true);
    expect(isFiniteVec(nodes[1].position)).toBe(true);
  });

  it('returns zero movement for an empty simulation', () => {
    const graph = createGraphData();
    expect(forceStep({ graph, settings: forceSettings(), nodes: [] })).toBe(0);
    expect(positionsFromNodes([]).size).toBe(0);
  });
});

describe('positionsFromNodes / vecFromPosition', () => {
  it('covers every node and returns detached coordinate copies', () => {
    const nodes = [simNode('a', 1, 2, 3), simNode('b', -4, 5, -6)];
    const positions = positionsFromNodes(nodes);

    expect(positions.size).toBe(2);
    expect(positions.get('a')).toEqual({ x: 1, y: 2, z: 3 });
    expect(positions.get('b')).toEqual({ x: -4, y: 5, z: -6 });

    nodes[0].position.x = 99;
    expect(positions.get('a')?.x).toBe(1);

    const copy = vecFromPosition(positions.get('a')!);
    copy.y = 77;
    expect(positions.get('a')?.y).toBe(2);
    expect(copy).toEqual({ x: 1, y: 77, z: 3 });
  });
});
