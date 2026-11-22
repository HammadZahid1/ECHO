import type { NodeType, RelationshipType } from './graph';

export interface DistributionBucket {
  key: string;
  label: string;
  count: number;
  color?: string;
}

export interface GraphStatistics {
  nodeCount: number;
  edgeCount: number;
  typeDistribution: DistributionBucket[];
  relationshipDistribution: DistributionBucket[];
  tagDistribution: DistributionBucket[];
  clusterCount: number;
  componentCount: number;
  isolatedNodeIds: string[];
  averageDegree: number;
  medianDegree: number;
  maxDegree: number;
  density: number;
  degreeDistribution: DistributionBucket[];
  mostConnectedNodeIds: string[];
  largestClusterSize: number;
  missingDescriptionCount: number;
  missingTagsCount: number;
  duplicateTitleGroups: string[][];
}

export interface GraphCluster {
  id: string;
  name: string;
  method: 'component' | 'label-propagation' | 'tag' | 'similarity' | 'neighborhood';
  nodeIds: string[];
  color: string;
  keywords: string[];
  size: number;
  density: number;
  collapsed: boolean;
}

export interface ClusterAnalysis {
  clusters: GraphCluster[];
  method: GraphCluster['method'];
  modularity: number;
}

export interface GrowthPoint {
  timestamp: number;
  nodes: number;
  edges: number;
  labels: number;
}

export interface HealthIssue {
  id: string;
  kind:
    | 'isolated'
    | 'hub'
    | 'weak-cluster'
    | 'duplicate-title'
    | 'likely-duplicate'
    | 'missing-description'
    | 'missing-tags'
    | 'oversized-cluster'
    | 'low-degree'
    | 'dangling-edge'
    | 'circular-self-edge';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  nodeIds: string[];
  edgeIds: string[];
  suggestion?: string;
  fix?: HealthFix;
}

export type HealthFix =
  | { kind: 'add-tag'; nodeId: string; tag: string }
  | { kind: 'describe'; nodeId: string }
  | { kind: 'connect'; source: string; target: string; type: RelationshipType }
  | { kind: 'merge'; keepId: string; removeId: string }
  | { kind: 'delete-edge'; edgeId: string };

export interface GraphHealthReport {
  issues: HealthIssue[];
  score: number;
  checkedAt: number;
  nodeCount: number;
  edgeCount: number;
}

export interface PathResult {
  nodeIds: string[];
  edgeIds: string[];
  length: number;
  totalStrength: number;
  relationshipTypes: RelationshipType[];
}

export interface PathSearchResult {
  paths: PathResult[];
  from: string;
  to: string;
  found: boolean;
  explored: number;
}

export interface NeighborhoodResult {
  centerId: string;
  depth: number;
  nodeIds: string[];
  edges: { edgeId: string; source: string; target: string; depth: number }[];
  byDepth: string[][];
}

export interface TypeCount {
  type: NodeType;
  count: number;
}
