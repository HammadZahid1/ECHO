import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXPORT_OPTIONS, exportGraph, exportSnapshot, exportWorkspace,
} from '@/lib/exporters';
import {
  createCamera, createDefaultSettings, createEdge, createGraphData, createNode, createWorkspace,
} from '@/lib/graph/factory';
import type { ExportFormat, GraphData, GraphSnapshot } from '@/types';

afterEach(() => vi.restoreAllMocks());

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', tags: ['x'] }),
    createNode({ id: 'b', title: 'Beta', tags: ['y'] }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1' }));
  return graph;
}

describe('exportGraph', () => {
  it('routes every supported format to the matching exporter', async () => {
    const graph = fixture();
    const cases: [ExportFormat, string][] = [
      ['json', 'application/json'],
      ['csv-nodes', 'text/csv'],
      ['csv-edges', 'text/csv'],
      ['markdown', 'text/markdown'],
      ['svg', 'image/svg+xml'],
    ];
    for (const [format, mimeType] of cases) {
      const result = await exportGraph(graph, { ...DEFAULT_EXPORT_OPTIONS, format });
      expect(result.mimeType).toBe(mimeType);
      expect(result.nodeCount).toBe(2);
    }
  });

  it('routes png exports through a canvas', async () => {
    const context = {
      fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillText: vi.fn(),
    };
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));

    const result = await exportGraph(fixture(), { ...DEFAULT_EXPORT_OPTIONS, format: 'png' }, 'Graph');
    expect(result.filename).toBe('graph.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.content).toBeInstanceOf(Blob);
    expect(getContext).toHaveBeenCalledWith('2d');
    expect(toBlob).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledTimes(2);
  });

  it('falls back to JSON for unsupported formats', async () => {
    const result = await exportGraph(
      fixture(), { ...DEFAULT_EXPORT_OPTIONS, format: 'graphml' as ExportFormat }, 'My Graph',
    );
    expect(result.mimeType).toBe('application/json');
    expect(result.filename).toBe('my-graph.json');
    const payload = JSON.parse(result.content as string) as { format: string };
    expect(payload.format).toBe('echo-graph');
  });

  it('uses the exported defaults when options are omitted', async () => {
    expect(DEFAULT_EXPORT_OPTIONS).toMatchObject({ format: 'json', scope: 'all', pretty: true });
    const result = await exportGraph(fixture());
    expect(result.filename).toBe('echo-graph.json');
    expect(result.content).toContain('\n  "format"');
  });
});

describe('exportWorkspace and exportSnapshot', () => {
  it('packages a workspace and honors metadata and snapshot toggles', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const graph = fixture();
    const snapshot: GraphSnapshot = {
      id: 's1', name: 'First', description: '', createdAt: 1000,
      graph, settings: createDefaultSettings(), camera: createCamera(),
    };
    const workspace = createWorkspace({
      id: 'w1', name: 'My Workspace', description: 'desc', color: '#ff0000',
      graph, snapshots: [snapshot],
    });

    const result = exportWorkspace(workspace, DEFAULT_EXPORT_OPTIONS);
    expect(result.filename).toBe('my-workspace.echo-workspace.json');
    expect(result.mimeType).toBe('application/json');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    const payload = JSON.parse(result.content as string) as {
      format: string; version: number; exportedAt: number;
      workspace: { id: string; settings?: unknown; snapshots?: unknown[]; graph: GraphData };
    };
    expect(payload).toMatchObject({ format: 'echo-workspace', version: 1, exportedAt: 1000 });
    expect(payload.workspace).toMatchObject({
      id: 'w1', name: 'My Workspace', description: 'desc', color: '#ff0000',
    });
    expect(payload.workspace.settings).toBeDefined();
    expect(payload.workspace.snapshots).toHaveLength(1);
    expect(payload.workspace.graph.nodes).toHaveLength(2);

    const minimal = exportWorkspace(workspace, {
      ...DEFAULT_EXPORT_OPTIONS, includeMetadata: false, includeTimestamps: false, pretty: false,
    });
    expect(minimal.content).not.toContain('\n');
    const minimalPayload = JSON.parse(minimal.content as string) as {
      workspace: { settings?: unknown; snapshots?: unknown[] };
    };
    expect(minimalPayload.workspace.settings).toBeUndefined();
    expect(minimalPayload.workspace.snapshots).toBeUndefined();
  });

  it('packages a named snapshot with graph counts and filename overrides', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const graph = fixture();
    const snapshot: GraphSnapshot = {
      id: 'snap', name: 'First Snapshot', description: 'snapshot description', createdAt: 1000,
      graph, settings: createDefaultSettings(), camera: createCamera(),
    };

    const result = exportSnapshot(snapshot, DEFAULT_EXPORT_OPTIONS);
    expect(result.filename).toBe('first-snapshot.echo-snapshot.json');
    expect(result.mimeType).toBe('application/json');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    const payload = JSON.parse(result.content as string) as {
      format: string; version: number; exportedAt: number; snapshot: GraphSnapshot;
    };
    expect(payload).toMatchObject({ format: 'echo-snapshot', version: 1, exportedAt: 1000 });
    expect(payload.snapshot).toMatchObject({ id: 'snap', name: 'First Snapshot' });
    expect(payload.snapshot.graph.nodes).toHaveLength(2);

    const renamed = exportSnapshot(snapshot, { ...DEFAULT_EXPORT_OPTIONS, filename: 'snap.json' });
    expect(renamed.filename).toBe('snap.json');
  });
});
