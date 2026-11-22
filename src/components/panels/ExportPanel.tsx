import { useMemo, useState } from 'react';
import { Download, FileArchive, FileJson, Image, LoaderCircle } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Select, Toggle } from '@/components/ui/controls';
import { ErrorState, StatTile } from '@/components/ui/states';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useClusters, useDerivedGraph } from '@/hooks/useGraphDerived';
import { DEFAULT_EXPORT_OPTIONS, exportGraph, exportWorkspace, exportSnapshot } from '@/lib/exporters';
import { downloadBlob } from '@/lib/utils/download';
import type { ExportFormat, ExportOptions, ExportResult } from '@/types';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv-nodes', label: 'CSV · nodes' },
  { value: 'csv-edges', label: 'CSV · relationships' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
];

export function ExportPanel() {
  const workspace = useActiveWorkspace();
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const derived = useDerivedGraph();
  const clusters = useClusters(workspace.graph);
  const pushToast = useUIStore((state) => state.pushToast);

  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [snapshotId, setSnapshotId] = useState('');
  const [last, setLast] = useState<ExportResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const scopedGraph = useMemo(() => {
    const graph = workspace.graph;
    if (options.scope === 'filtered') return derived.graph;
    if (options.scope === 'selected') {
      const ids = new Set(selectedNodeIds);
      return { ...graph, nodes: graph.nodes.filter((node) => ids.has(node.id)), edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)) };
    }
    if (options.scope === 'cluster') {
      const cluster = clusters.clusters.find((item) => item.nodeIds.includes(selectedNodeIds[0] ?? '')) ?? clusters.clusters[0];
      if (!cluster) return { ...graph, nodes: [], edges: [] };
      const ids = new Set(cluster.nodeIds);
      return { ...graph, nodes: graph.nodes.filter((node) => ids.has(node.id)), edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)) };
    }
    return graph;
  }, [workspace.graph, options.scope, derived, clusters, selectedNodeIds]);

  const finish = (result: ExportResult): void => {
    downloadBlob(result.content, result.filename, result.mimeType);
    setLast(result);
    setError('');
    pushToast({ kind: 'success', title: 'Export ready', detail: `${result.nodeCount} nodes · ${result.edgeCount} relationships` });
  };

  const handleGraphExport = async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await exportGraph(scopedGraph, { ...options, nodeIds: selectedNodeIds }, workspace.name);
      finish(result);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Export failed.';
      setError(message);
      pushToast({ kind: 'error', title: 'Export failed', detail: message });
    } finally {
      setBusy(false);
    }
  };

  const handleWorkspaceExport = (): void => {
    try { finish(exportWorkspace(workspace, options)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Workspace export failed.'); }
  };

  const handleSnapshotExport = (): void => {
    const snapshot = workspace.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) { setError('Select a snapshot to export.'); return; }
    try { finish(exportSnapshot(snapshot, options)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Snapshot export failed.'); }
  };

  return (
    <Panel title="Export" subtitle="Save knowledge in an open format">
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Select label="Format" value={options.format} onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value as ExportFormat }))}>
            {FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
          </Select>
          <Select label="Scope" value={options.scope} onChange={(event) => setOptions((current) => ({ ...current, scope: event.target.value as ExportOptions['scope'] }))}>
            <option value="all">All knowledge</option>
            <option value="selected">Selected nodes ({selectedNodeIds.length})</option>
            <option value="cluster">Selected cluster</option>
            <option value="filtered">Current filters</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Nodes in scope" value={scopedGraph.nodes.length} accent="#4fd8e8" />
          <StatTile label="Relationships" value={scopedGraph.edges.length} accent="#9d7bf5" />
        </div>

        <Divider label="Include" />
        <div className="space-y-0.5">
          <Toggle label="Metadata" checked={options.includeMetadata} onChange={(value) => setOptions((current) => ({ ...current, includeMetadata: value }))} />
          <Toggle label="Positions" checked={options.includePositions} onChange={(value) => setOptions((current) => ({ ...current, includePositions: value }))} />
          <Toggle label="Timestamps" checked={options.includeTimestamps} onChange={(value) => setOptions((current) => ({ ...current, includeTimestamps: value }))} />
          <Toggle label="Pretty print" checked={options.pretty} onChange={(value) => setOptions((current) => ({ ...current, pretty: value }))} />
        </div>

        {error && <ErrorState title="Export error" description={error} />}

        {last && (
          <div className="rounded border border-emerald-400/25 bg-emerald-400/[0.05] p-2.5">
            <p className="text-[10px] font-medium text-emerald-300">Last export: {last.filename}</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-500">{last.nodeCount} nodes · {last.edgeCount} relationships</p>
          </div>
        )}

        <Button variant="primary" icon={busy ? <LoaderCircle size={12} className="animate-spin" /> : <Download size={12} />} onClick={() => void handleGraphExport()} disabled={busy} className="w-full">
          {busy ? 'Preparing export…' : 'Export graph'}
        </Button>

        <Divider label="Bundles" />
        <div className="space-y-2">
          <Button variant="secondary" icon={<FileArchive size={12} />} onClick={handleWorkspaceExport} className="w-full">Export whole workspace (.json)</Button>
          <Select label="Snapshot" value={snapshotId} onChange={(event) => setSnapshotId(event.target.value)}>
            <option value="">Select a snapshot…</option>
            {workspace.snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>)}
          </Select>
          <Button variant="secondary" icon={<FileJson size={12} />} onClick={handleSnapshotExport} disabled={!snapshotId} className="w-full">Export snapshot (.json)</Button>
        </div>

        <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-zinc-700"><Image size={10} className="mt-0.5 shrink-0" />SVG and PNG exports capture the current 2D projection of the graph. All processing happens locally in your browser.</p>
      </div>
    </Panel>
  );
}
