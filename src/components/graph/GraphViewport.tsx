import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { useDerivedGraph } from '@/hooks/useGraphDerived';
import { Universe3D } from './Universe3D';
import { Graph2D } from './Graph2D';
import { GraphControls } from './GraphControls';
import { RadialExplorer } from '@/components/views/RadialExplorer';
import { HierarchyExplorer } from '@/components/views/HierarchyExplorer';
import { ClusterExplorer } from '@/components/views/ClusterExplorer';
import { TableExplorer } from '@/components/views/TableExplorer';
import { NetworkOverview } from '@/components/views/NetworkOverview';
import { TimelineExplorer } from '@/components/views/TimelineExplorer';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/Button';

export function GraphViewport() {
  const workspace = useActiveWorkspace();
  const view = useUIStore((state) => state.view);
  const selectedIds = useGraphStore((state) => state.selectedNodeIds);
  const hoveredId = useGraphStore((state) => state.hoveredNodeId);
  const focusId = useGraphStore((state) => state.focusedNodeId);
  const createNode = useGraphStore((state) => state.createNode);
  const derived = useDerivedGraph();
  const graph = derived.graph;
  const screenReaderSummary = useSettingsStore((state) => state.accessibility.screenReaderGraphSummary);
  const shared = {
    graph,
    visual: workspace.settings.visual,
    focusId,
    selectedIds,
    hoveredId,
  };
  const stats = derived.statistics;
  const topNodes = stats.mostConnectedNodeIds
    .map((id) => graph.nodes.find((node) => node.id === id)?.title)
    .filter((title): title is string => Boolean(title))
    .slice(0, 3);
  const summary = [
    `Graph summary: ${stats.nodeCount} nodes and ${stats.edgeCount} relationships.`,
    `${stats.clusterCount} clusters and ${stats.isolatedNodeIds.length} isolated nodes.`,
    selectedIds.length > 0 ? `${selectedIds.length} nodes selected.` : 'No nodes selected.',
    topNodes.length > 0 ? `Most connected: ${topNodes.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  const content = (() => {
    if (graph.nodes.length === 0) {
      return (
        <EmptyState
          title="Your universe is empty"
          description="Create a node, load a demo universe, or import knowledge to begin exploring relationships."
          action={<div className="flex gap-2"><Button variant="primary" onClick={() => createNode({ title: 'First concept' })}>Create node</Button><Button onClick={() => useUIStore.getState().openModal('import')}>Import</Button></div>}
        />
      );
    }
    switch (view) {
      case 'graph-2d': return <Graph2D {...shared} />;
      case 'radial': return <RadialExplorer graph={graph} />;
      case 'hierarchical': return <HierarchyExplorer graph={graph} />;
      case 'cluster': return <ClusterExplorer graph={graph} />;
      case 'table': return <TableExplorer graph={graph} />;
      case 'network': return <NetworkOverview graph={graph} statistics={derived.statistics} />;
      case 'timeline': return <TimelineExplorer graph={graph} />;
      case 'universe':
      default: return <Universe3D {...shared} />;
    }
  })();

  return (
    <section
      className="relative min-h-0 flex-1 overflow-hidden bg-[#08090b]"
      aria-label="Knowledge graph viewport"
      onContextMenu={(event) => {
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement;
        if (target.closest('button, input, select, textarea, [role="menu"], [role="dialog"]')) return;
        event.preventDefault();
        useUIStore.getState().openContextMenu({ x: event.clientX, y: event.clientY, target: 'graph' });
      }}
    >
      {screenReaderSummary && <p className="sr-only" aria-live="polite">{summary}</p>}
      {content}
      {graph.nodes.length > 0 && <GraphControls />}
    </section>
  );
}
