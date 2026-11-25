import { describe, expect, it } from 'vitest';
import { NODE_TYPES, RELATIONSHIP_TYPES } from '@/types';
import type { GraphData } from '@/types';
import { philosophyDataset } from '../philosophy';

const dataset = philosophyDataset;
const FIXED_CREATED_AT = Date.UTC(2025, 0, 1);

const fixture = {
  id: 'philosophy',
  name: 'Philosophy',
  accent: '#e88fb8',
  topics: ['Metaphysics', 'Epistemology', 'Ethics', 'Existentialism'],
  rootId: 'phil-field',
  tagIds: ['phil-tag-metaphysics', 'phil-tag-epistemology', 'phil-tag-ethics', 'phil-tag-history'],
  tagNames: ['metaphysics', 'epistemology', 'ethics', 'history'],
} as const;

function createGraph(): GraphData {
  return dataset.create();
}

function idsOf<T extends { id: string }>(items: T[]): string[] {
  return items.map((item) => item.id);
}

describe('philosophyDataset', () => {
  it('exposes consistent registry metadata', () => {
    expect(dataset.id).toBe(fixture.id);
    expect(dataset.name).toBe(fixture.name);
    expect(dataset.description.trim().length).toBeGreaterThan(40);
    expect(dataset.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(dataset.topics).toEqual([...fixture.topics]);
    expect(new Set(dataset.topics).size).toBe(dataset.topics.length);
  });

  it('creates a deterministic graph with independent arrays and objects', () => {
    const first = createGraph();
    const second = createGraph();

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.nodes).not.toBe(first.nodes);
    expect(second.edges).not.toBe(first.edges);
    expect(second.tags).not.toBe(first.tags);

    first.nodes[0].title = 'mutated';
    first.edges[0].label = 'mutated';
    first.tags[0].name = 'mutated';

    expect(second.nodes[0].title).not.toBe('mutated');
    expect(second.edges[0].label).not.toBe('mutated');
    expect(second.tags[0].name).not.toBe('mutated');
  });

  it('defines a substantial set of unique, well-described nodes', () => {
    const graph = createGraph();
    const ids = idsOf(graph.nodes);

    expect(graph.nodes.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(graph.nodes.every((node) => node.title.trim().length > 0 && node.description.trim().length > 0)).toBe(true);
    expect(graph.nodes.every((node) => node.importance >= 0 && node.importance <= 1)).toBe(true);
    expect(graph.nodes.find((node) => node.id === fixture.rootId)).toMatchObject({ importance: 1 });
  });

  it('uses only known node types and populated metadata', () => {
    const graph = createGraph();
    const knownTypes = new Set<string>(NODE_TYPES);
    const metadataValues = graph.nodes.flatMap((node) => Object.values(node.metadata));

    expect(graph.nodes.every((node) => knownTypes.has(node.type))).toBe(true);
    expect(metadataValues.length).toBeGreaterThan(0);
    expect(metadataValues.every((value) => value === null || ['string', 'number', 'boolean'].includes(typeof value))).toBe(true);
    expect(graph.nodes.every((node) => node.createdAt === FIXED_CREATED_AT && node.updatedAt === FIXED_CREATED_AT)).toBe(true);
  });

  it('uses only known relationship types with unique ids and readable labels', () => {
    const graph = createGraph();
    const knownTypes = new Set<string>(RELATIONSHIP_TYPES);
    const ids = idsOf(graph.edges);

    expect(graph.edges.length).toBeGreaterThanOrEqual(28);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(graph.edges.every((edge) => knownTypes.has(edge.type))).toBe(true);
    expect(graph.edges.every((edge) => edge.label.trim().length > 0)).toBe(true);
    expect(graph.edges.every((edge) => edge.strength >= 0 && edge.strength <= 1)).toBe(true);
    expect(graph.edges.every((edge) => edge.createdAt === FIXED_CREATED_AT && edge.updatedAt === FIXED_CREATED_AT)).toBe(true);
  });

  it('connects every edge to existing nodes and mixes directedness', () => {
    const graph = createGraph();
    const nodeIds = new Set(idsOf(graph.nodes));

    expect(graph.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))).toBe(true);
    expect(graph.edges.every((edge) => edge.source !== edge.target)).toBe(true);
    expect(graph.edges.some((edge) => edge.directed)).toBe(true);
    expect(graph.edges.some((edge) => !edge.directed)).toBe(true);
    expect(graph.edges.filter((edge) => edge.source === fixture.rootId).length).toBeGreaterThan(0);
  });

  it('declares unique, described and dated tags', () => {
    const graph = createGraph();

    expect(graph.tags.map((tag) => tag.id)).toEqual([...fixture.tagIds]);
    expect(graph.tags.map((tag) => tag.name)).toEqual([...fixture.tagNames]);
    expect(new Set(idsOf(graph.tags)).size).toBe(graph.tags.length);
    expect(graph.tags.every((tag) => Boolean(tag.description?.trim()))).toBe(true);
    expect(graph.tags.every((tag) => /^#[0-9a-f]{6}$/i.test(tag.color))).toBe(true);
    expect(graph.tags.every((tag) => tag.createdAt === FIXED_CREATED_AT)).toBe(true);
  });

  it('uses every declared tag on at least one node', () => {
    const graph = createGraph();
    const usedTags = new Set(graph.nodes.flatMap((node) => node.tags));

    expect(graph.tags.every((tag) => usedTags.has(tag.name))).toBe(true);
    expect(graph.nodes.every((node) => node.tags.length > 0 && node.tags.every((tag) => tag.trim().length > 0))).toBe(true);
  });
});
