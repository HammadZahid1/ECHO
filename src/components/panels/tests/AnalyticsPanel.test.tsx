import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsPanel } from '@/components/panels/AnalyticsPanel';
import { createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

const DAY = 86_400_000;

function seededGraph(): GraphData {
  const now = Date.now();
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', type: 'concept', tags: ['science'], createdAt: now - 3 * DAY }),
      createNode({ id: 'n2', title: 'Beta', type: 'idea', tags: ['science'], createdAt: now - 2 * DAY }),
      createNode({ id: 'n3', title: 'Gamma', type: 'note', tags: ['math'], createdAt: now - DAY }),
    ],
    edges: [
      createEdge('n1', 'n2', { id: 'e1', type: 'supports', createdAt: now - 2 * DAY }),
      createEdge('n1', 'n3', { id: 'e2', type: 'related', createdAt: now - DAY }),
    ],
    tags: [],
  };
}

function setGraph(graph: GraphData): void {
  const workspace = createWorkspace({ name: 'Test universe', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ toasts: [], modal: null });
}

function stat(label: string): string {
  const element = screen.getByText(label, { selector: 'p' });
  return element.parentElement?.querySelectorAll('p')[1]?.textContent?.trim() ?? '';
}

describe('AnalyticsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    setGraph(seededGraph());
  });

  it('renders the panel heading and live node/relationship counts', () => {
    render(<AnalyticsPanel />);
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('3 nodes · 2 relationships')).toBeInTheDocument();
    expect(stat('Nodes')).toBe('3');
    expect(stat('Relationships')).toBe('2');
  });

  it('reports structural statistics from the graph', () => {
    render(<AnalyticsPanel />);
    expect(stat('Components')).toBe('1');
    expect(stat('Density')).toBe('0.667');
    expect(stat('Median degree')).toBe('1.0');
    expect(stat('Max degree')).toBe('2');
    expect(stat('Isolated')).toBe('0');
  });

  it('lists the most connected nodes with their degree', () => {
    render(<AnalyticsPanel />);
    expect(screen.getByText('Most connected')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByText('No relationships yet. Connect nodes to see hubs here.')).not.toBeInTheDocument();
  });

  it('breaks down node types, relationships and tags', () => {
    render(<AnalyticsPanel />);
    expect(screen.getByText('Node types')).toBeInTheDocument();
    expect(screen.getByText('Concept')).toBeInTheDocument();
    expect(screen.getByText('Idea')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('Supports')).toBeInTheDocument();
    expect(screen.getByText('Related to')).toBeInTheDocument();
    expect(screen.getByText('science')).toBeInTheDocument();
    expect(screen.getByText('math')).toBeInTheDocument();
  });

  it('builds dated growth buckets with node and relationship counts', () => {
    render(<AnalyticsPanel />);
    const buckets = document.querySelectorAll('[title*="nodes,"]');
    expect(buckets.length).toBeGreaterThan(1);
    expect(buckets[0]?.getAttribute('title')).toMatch(/\d+ nodes, \d+ relationships/);
  });

  it('shows empty guidance when the active graph has no data', () => {
    setGraph(createGraphData());
    render(<AnalyticsPanel />);
    expect(screen.getByText('0 nodes · 0 relationships')).toBeInTheDocument();
    expect(stat('Nodes')).toBe('0');
    expect(screen.getByText('No relationships yet. Connect nodes to see hubs here.')).toBeInTheDocument();
    expect(screen.getByText('No nodes to classify.')).toBeInTheDocument();
    expect(screen.getByText('No relationships to classify.')).toBeInTheDocument();
    expect(screen.getByText('No timestamped items yet.')).toBeInTheDocument();
  });
});
