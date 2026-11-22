import type { GraphData, GraphLayoutSettings, Vec3 } from '@/types';
import type { PositionMap, SimulationNode } from './types';
import { forceStep, positionsFromNodes } from './force';
import { seededRandom } from '@/lib/utils/math';

/** Mutable physics engine kept outside React/Zustand state. */
export class ForceSimulation {
  private nodes: SimulationNode[] = [];
  private graph: GraphData = { nodes: [], edges: [], tags: [] };
  private settings: GraphLayoutSettings;
  private energy = 1;
  private seed: number;

  constructor(settings: GraphLayoutSettings, seed = 42) {
    this.settings = settings;
    this.seed = seed;
  }

  initialize(graph: GraphData, existing?: PositionMap): void {
    this.graph = graph;
    const random = seededRandom(this.seed + graph.nodes.length);
    const ids = new Set(graph.nodes.map((node) => node.id));
    this.nodes = graph.nodes.map((node, index) => {
      const angle = (index / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      const radius = 8 + Math.sqrt(index) * 4;
      const initial = existing?.get(node.id) ?? {
        x: Math.cos(angle) * radius + (random() - 0.5) * 4,
        y: (random() - 0.5) * radius * 0.5,
        z: Math.sin(angle) * radius + (random() - 0.5) * 4,
      };
      const mass = 0.7 + Math.min(1.5, node.importance + (graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length / ids.size) * 0.5);
      return {
        id: node.id,
        position: { ...initial },
        velocity: { x: 0, y: 0, z: 0 },
        pinned: node.pinned,
        mass,
      };
    });
    this.energy = 1;
  }

  syncGraph(graph: GraphData, keepPositions = true): void {
    const existing = keepPositions ? this.getPositions() : undefined;
    const pinned = new Set(graph.nodes.filter((node) => node.pinned).map((node) => node.id));
    this.graph = graph;
    const known = new Map(this.nodes.map((node) => [node.id, node]));
    this.nodes = graph.nodes.map((node, index) => {
      const previous = known.get(node.id);
      const position = previous?.position ?? existing?.get(node.id) ?? {
        x: Math.cos(index) * 10,
        y: 0,
        z: Math.sin(index) * 10,
      };
      return {
        id: node.id,
        position: { ...position },
        velocity: previous ? { ...previous.velocity } : { x: 0, y: 0, z: 0 },
        pinned: pinned.has(node.id),
        mass: previous?.mass ?? 1,
      };
    });
    this.energy = Math.max(this.energy, 0.4);
  }

  setSettings(settings: GraphLayoutSettings): void {
    if (settings.kind !== this.settings.kind) this.energy = 1;
    this.settings = settings;
  }

  step(delta = 1): PositionMap {
    if (!this.settings.running || this.nodes.length === 0) return this.getPositions();
    const movement = forceStep({ graph: this.graph, settings: this.settings, nodes: this.nodes, delta, seed: this.seed });
    this.energy = Math.max(0, Math.min(1, movement / 4));
    return this.getPositions();
  }

  getPositions(): PositionMap {
    return positionsFromNodes(this.nodes);
  }

  getPosition(id: string): Vec3 | undefined {
    const node = this.nodes.find((candidate) => candidate.id === id);
    return node ? { ...node.position } : undefined;
  }

  setPosition(id: string, position: Vec3): void {
    const node = this.nodes.find((candidate) => candidate.id === id);
    if (!node) return;
    node.position = { ...position };
    node.velocity = { x: 0, y: 0, z: 0 };
    this.reheat(0.35);
  }

  setPinned(id: string, pinned: boolean): void {
    const node = this.nodes.find((candidate) => candidate.id === id);
    if (node) node.pinned = pinned;
  }

  reheat(value = 1): void {
    this.energy = Math.max(this.energy, value);
  }

  isSettled(): boolean {
    return this.energy < 0.015;
  }

  getEnergy(): number {
    return this.energy;
  }

  getNodeCount(): number {
    return this.nodes.length;
  }
}
