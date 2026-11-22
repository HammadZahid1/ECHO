import { describe, expect, it } from 'vitest';
import { ForceSimulation } from '@/lib/layout/simulation';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData, GraphLayoutSettings } from '@/types';

function forceSettings(overrides: Partial<GraphLayoutSettings> = {}): GraphLayoutSettings {
  return {
    ...createDefaultSettings().layout,
    kind: 'force',
    repulsion: 0,
    attraction: 0.5,
    linkDistance: 16,
    gravity: 0.02,
    damping: 0.9,
    collision: 0,
    strength: 1,
    speed: 1,
    running: true,
    focusNodeId: null,
    ...overrides,
  };
}

function graph(): GraphData {
  const data = createGraphData();
  data.nodes.push(createNode({ id: 'a', title: 'A' }), createNode({ id: 'b', title: 'B' }));
  data.edges.push(createEdge('a', 'b', { id: 'e1' }));
  return data;
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('ForceSimulation initialization and stepping', () => {
  it('covers every node and honours supplied existing positions', () => {
    const simulation = new ForceSimulation(forceSettings(), 7);
    simulation.initialize(graph(), new Map([['a', { x: 1, y: 2, z: 3 }]]));

    const positions = simulation.getPositions();
    expect(simulation.getNodeCount()).toBe(2);
    expect(positions.size).toBe(2);
    expect(simulation.getPosition('a')).toEqual({ x: 1, y: 2, z: 3 });
    expect(simulation.getPosition('missing')).toBeUndefined();

    const detached = simulation.getPosition('a')!;
    detached.x = 100;
    expect(simulation.getPosition('a')?.x).toBe(1);
  });

  it('advances finite positions and bounded energy while running', () => {
    const simulation = new ForceSimulation(forceSettings(), 7);
    simulation.initialize(graph());
    const before = simulation.getPositions();

    const after = simulation.step(1);
    expect(after.size).toBe(2);
    expect([...after.values()].every(finiteVec)).toBe(true);
    expect(after).not.toEqual(before);
    expect(simulation.getEnergy()).toBeGreaterThanOrEqual(0);
    expect(simulation.getEnergy()).toBeLessThanOrEqual(1);
  });

  it('does not move nodes when the simulation is paused', () => {
    const simulation = new ForceSimulation(forceSettings({ running: false }), 7);
    simulation.initialize(graph());
    const before = simulation.getPositions();
    const energy = simulation.getEnergy();

    expect(simulation.step()).toEqual(before);
    expect(simulation.getEnergy()).toBe(energy);
  });
});

describe('ForceSimulation pinning and positions', () => {
  it('keeps pinned nodes still while free nodes respond to gravity', () => {
    const simulation = new ForceSimulation(forceSettings({ gravity: 0.04 }), 7);
    simulation.initialize(graph());
    simulation.setPinned('a', true);
    const pinnedBefore = simulation.getPosition('a');
    const freeBefore = simulation.getPosition('b');

    for (let i = 0; i < 5; i += 1) simulation.step();

    expect(simulation.getPosition('a')).toEqual(pinnedBefore);
    expect(simulation.getPosition('b')).not.toEqual(freeBefore);
    expect(finiteVec(simulation.getPosition('b')!)).toBe(true);
  });

  it('sets positions exactly and reheats the simulation', () => {
    const simulation = new ForceSimulation(forceSettings(), 7);
    simulation.initialize(graph());

    simulation.setPosition('a', { x: 3, y: -1, z: 2 });
    expect(simulation.getPosition('a')).toEqual({ x: 3, y: -1, z: 2 });
    expect(simulation.getEnergy()).toBeGreaterThanOrEqual(0.35);

    simulation.setPosition('ghost', { x: 0, y: 0, z: 0 });
    expect(simulation.getPosition('ghost')).toBeUndefined();
    expect(simulation.getNodeCount()).toBe(2);
  });
});

describe('ForceSimulation settling and syncing', () => {
  const calm = forceSettings({ gravity: 0, attraction: 0, repulsion: 0, collision: 0 });

  it('settles when movement is zero and reheats when the kind changes', () => {
    const simulation = new ForceSimulation(calm, 7);
    simulation.initialize(graph());
    simulation.step();

    expect(simulation.getEnergy()).toBe(0);
    expect(simulation.isSettled()).toBe(true);

    simulation.reheat(0.5);
    expect(simulation.isSettled()).toBe(false);
    simulation.setSettings({ ...calm, speed: 2 });
    expect(simulation.getEnergy()).toBeCloseTo(0.5);
    simulation.setSettings({ ...calm, kind: 'circular' });
    expect(simulation.getEnergy()).toBe(1);
  });

  it('syncs added and removed nodes while preserving known positions', () => {
    const simulation = new ForceSimulation(calm, 7);
    const data = graph();
    simulation.initialize(data);
    const aBefore = simulation.getPosition('a');

    const added = createNode({ id: 'c', title: 'C', pinned: true });
    data.nodes.push(added);
    data.edges.push(createEdge('b', 'c', { id: 'e2' }));
    simulation.syncGraph(data, true);

    expect(simulation.getNodeCount()).toBe(3);
    expect(simulation.getPosition('a')).toEqual(aBefore);
    expect(simulation.getPosition('c')).toEqual({ x: Math.cos(2) * 10, y: 0, z: Math.sin(2) * 10 });
    expect(simulation.getEnergy()).toBeGreaterThanOrEqual(0.4);

    simulation.setSettings(forceSettings({ gravity: 0.04 }));
    simulation.step();
    expect(simulation.getPosition('c')).toEqual({ x: Math.cos(2) * 10, y: 0, z: Math.sin(2) * 10 });

    const reduced = createGraphData();
    reduced.nodes.push(createNode({ id: 'b', title: 'B' }));
    simulation.syncGraph(reduced, true);
    expect(simulation.getNodeCount()).toBe(1);
    expect(simulation.getPositions().has('a')).toBe(false);
  });
});
