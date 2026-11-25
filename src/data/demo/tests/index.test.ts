import { describe, expect, it } from 'vitest';
import { NODE_TYPES, RELATIONSHIP_TYPES } from '@/types';
import type { GraphData } from '@/types';
import {
  DEMO_DATASETS,
  artificialIntelligenceDataset,
  astronomyDataset,
  computerScienceDataset,
  createDemoGraph,
  getDemoDataset,
  learningSystemsDataset,
  philosophyDataset,
  productDevelopmentDataset,
  roboticsDataset,
  scientificResearchDataset,
  softwareEngineeringDataset,
} from '../index';

const expectedDatasets = [
  softwareEngineeringDataset,
  artificialIntelligenceDataset,
  astronomyDataset,
  philosophyDataset,
  scientificResearchDataset,
  productDevelopmentDataset,
  learningSystemsDataset,
  roboticsDataset,
  computerScienceDataset,
];

const expectedIds = [
  'software-engineering',
  'artificial-intelligence',
  'astronomy',
  'philosophy',
  'scientific-research',
  'product-development',
  'learning-systems',
  'robotics',
  'computer-science',
];

describe('demo dataset registry', () => {
  it('registers every dataset in the documented order', () => {
    expect(DEMO_DATASETS).toHaveLength(9);
    expect(DEMO_DATASETS).toEqual(expectedDatasets);
    expect(DEMO_DATASETS.map((dataset) => dataset.id)).toEqual(expectedIds);
  });

  it('gives every dataset a unique id and name', () => {
    const ids = DEMO_DATASETS.map((dataset) => dataset.id);
    const names = DEMO_DATASETS.map((dataset) => dataset.name);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(ids.every((id) => id.trim().length > 0)).toBe(true);
    expect(names.every((name) => name.trim().length > 0)).toBe(true);
    expect(DEMO_DATASETS.every((dataset) => dataset.description.trim().length > 0)).toBe(true);
  });

  it('resolves each dataset by id and rejects unknown ids', () => {
    for (const dataset of DEMO_DATASETS) {
      expect(getDemoDataset(dataset.id)).toBe(dataset);
    }

    expect(getDemoDataset('not-a-dataset')).toBeUndefined();
    expect(getDemoDataset('')).toBeUndefined();
  });

  it('re-exports the exact dataset objects held by the registry', () => {
    expect(DEMO_DATASETS[0]).toBe(softwareEngineeringDataset);
    expect(DEMO_DATASETS[1]).toBe(artificialIntelligenceDataset);
    expect(DEMO_DATASETS[2]).toBe(astronomyDataset);
    expect(DEMO_DATASETS[3]).toBe(philosophyDataset);
    expect(DEMO_DATASETS[4]).toBe(scientificResearchDataset);
    expect(DEMO_DATASETS[5]).toBe(productDevelopmentDataset);
    expect(DEMO_DATASETS[6]).toBe(learningSystemsDataset);
    expect(DEMO_DATASETS[7]).toBe(roboticsDataset);
    expect(DEMO_DATASETS[8]).toBe(computerScienceDataset);
  });

  it('creates graphs through the registry and returns null for unknown ids', () => {
    for (const dataset of DEMO_DATASETS) {
      const graph = createDemoGraph(dataset.id);
      expect(graph).not.toBeNull();
      expect(graph).toEqual(dataset.create());
    }

    expect(createDemoGraph('missing')).toBeNull();
  });

  it('returns an independent graph copy from createDemoGraph', () => {
    const throughRegistry = createDemoGraph('software-engineering')!;
    const direct = softwareEngineeringDataset.create();

    expect(throughRegistry).toEqual(direct);
    throughRegistry.nodes[0].title = 'changed';
    throughRegistry.edges[0].label = 'changed';
    expect(direct.nodes[0].title).not.toBe('changed');
    expect(direct.edges[0].label).not.toBe('changed');
  });

  it('produces graph-wide unique ids, valid types and valid edge endpoints', () => {
    const knownNodeTypes = new Set<string>(NODE_TYPES);
    const knownRelationshipTypes = new Set<string>(RELATIONSHIP_TYPES);

    for (const dataset of DEMO_DATASETS) {
      const graph: GraphData = dataset.create();
      const nodeIds = new Set(graph.nodes.map((node) => node.id));

      expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(graph.nodes.length);
      expect(new Set(graph.edges.map((edge) => edge.id)).size).toBe(graph.edges.length);
      expect(new Set(graph.tags.map((tag) => tag.id)).size).toBe(graph.tags.length);
      expect(graph.nodes.every((node) => knownNodeTypes.has(node.type))).toBe(true);
      expect(graph.edges.every((edge) => knownRelationshipTypes.has(edge.type))).toBe(true);
      expect(graph.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))).toBe(true);
    }
  });

  it('produces deterministic graphs with populated metadata and described tags', () => {
    for (const dataset of DEMO_DATASETS) {
      const graph = dataset.create();
      const again = dataset.create();

      expect(again).toEqual(graph);
      expect(graph.nodes.some((node) => Object.keys(node.metadata).length > 0)).toBe(true);
      expect(graph.nodes.every((node) => node.tags.length > 0)).toBe(true);
      expect(graph.tags.every((tag) => Boolean(tag.description?.trim()))).toBe(true);
    }
  });
});
