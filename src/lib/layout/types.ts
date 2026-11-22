import type { GraphData, GraphLayoutSettings, Vec3 } from '@/types';

export type PositionMap = Map<string, Vec3>;

export interface LayoutOptions {
  graph: GraphData;
  settings: GraphLayoutSettings;
  focusNodeId?: string | null;
  seed?: number;
  radius?: number;
  dimensions?: 2 | 3;
}

export interface LayoutResult {
  positions: PositionMap;
  iterations: number;
  settled: boolean;
}

export type LayoutFunction = (options: LayoutOptions) => PositionMap;

export interface SimulationNode {
  id: string;
  position: Vec3;
  velocity: Vec3;
  pinned: boolean;
  mass: number;
}
