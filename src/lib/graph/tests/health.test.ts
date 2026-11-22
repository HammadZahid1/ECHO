import { describe, expect, it } from 'vitest';
import { analyzeGraphHealth } from '@/lib/graph/health';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData, HealthIssue } from '@/types';

function messyGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', description: 'Has a description', tags: ['x'] }),
    createNode({ id: 'b', title: 'Alpha', description: '', tags: [] }),
    createNode({ id: 'c', title: 'Charlie', description: '', tags: ['y'] }),
    createNode({ id: 'd', title: 'Delta', description: 'Documented', tags: ['z'] }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1' }),
    createEdge('a', 'd', { id: 'e2' }),
    createEdge('d', 'd', { id: 'loop' }),
    createEdge('a', 'ghost', { id: 'bad' }),
  );
  return graph;
}

function cleanGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', description: 'first topic', tags: ['x'] }),
    createNode({ id: 'b', title: 'Bravo', description: 'second topic', tags: ['y'] }),
    createNode({ id: 'c', title: 'Charlie', description: 'third topic', tags: ['z'] }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1' }),
    createEdge('b', 'c', { id: 'e2' }),
    createEdge('c', 'a', { id: 'e3' }),
  );
  return graph;
}

function ofKind(issues: HealthIssue[], kind: HealthIssue['kind']): HealthIssue[] {
  return issues.filter((issue) => issue.kind === kind);
}

describe('analyzeGraphHealth', () => {
  it('detects isolated nodes, duplicate titles, self edges and dangling edges', () => {
    const report = analyzeGraphHealth(messyGraph());
    expect(report.nodeCount).toBe(4);
    expect(report.edgeCount).toBe(4);
    expect(report.checkedAt).toBeGreaterThan(0);

    const isolated = ofKind(report.issues, 'isolated');
    expect(isolated).toHaveLength(1);
    expect(isolated[0]?.nodeIds).toEqual(['c']);

    const duplicates = ofKind(report.issues, 'duplicate-title');
    expect(duplicates).toHaveLength(1);
    expect(new Set(duplicates[0]?.nodeIds)).toEqual(new Set(['a', 'b']));
    expect(duplicates[0]?.fix?.kind).toBe('merge');

    expect(ofKind(report.issues, 'circular-self-edge').map((issue) => issue.edgeIds[0])).toEqual(['loop']);
    const dangling = ofKind(report.issues, 'dangling-edge');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]?.severity).toBe('critical');
    expect(dangling[0]?.fix).toEqual({ kind: 'delete-edge', edgeId: 'bad' });
  });

  it('reports missing descriptions, missing tags and weakly connected nodes', () => {
    const issues = analyzeGraphHealth(messyGraph()).issues;
    expect(ofKind(issues, 'missing-description').map((issue) => issue.nodeIds[0]).sort()).toEqual(['b', 'c']);
    expect(ofKind(issues, 'missing-tags').map((issue) => issue.nodeIds[0])).toEqual(['b']);
    expect(ofKind(issues, 'low-degree').map((issue) => issue.nodeIds[0])).toEqual(['b']);
    expect(ofKind(issues, 'isolated')[0]?.severity).toBe('warning');
    expect(new Set(issues.map((issue) => issue.id)).size).toBe(issues.length);
  });

  it('assigns severities and computes a score that reflects the findings', () => {
    const messy = analyzeGraphHealth(messyGraph());
    const clean = analyzeGraphHealth(cleanGraph());
    expect(clean.issues).toEqual([]);
    expect(clean.score).toBe(100);
    expect(messy.score).toBeLessThan(100);
    expect(messy.score).toBeGreaterThan(0);
    expect(messy.score).toBeLessThan(clean.score);
    expect(messy.issues.some((issue) => issue.severity === 'warning')).toBe(true);
    expect(messy.issues.some((issue) => issue.severity === 'info')).toBe(true);
  });

  it('reports a perfectly healthy empty graph', () => {
    const report = analyzeGraphHealth(createGraphData());
    expect(report.issues).toEqual([]);
    expect(report.score).toBe(100);
    expect(report.nodeCount).toBe(0);
    expect(report.edgeCount).toBe(0);
  });
});
