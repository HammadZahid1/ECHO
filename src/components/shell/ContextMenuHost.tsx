import { useMemo } from 'react';
import {
  CirclePlus,
  Copy,
  Crosshair,
  Download,
  Focus,
  Link2,
  Pin,
  Search,
  Settings2,
  Trash2,
  Unlink,
  Upload,
  Waypoints,
} from 'lucide-react';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { ContextMenu, type MenuItem } from '@/components/ui/ContextMenu';

export function ContextMenuHost() {
  const menu = useUIStore((state) => state.contextMenu);
  const closeContextMenu = useUIStore((state) => state.closeContextMenu);
  const openModal = useUIStore((state) => state.openModal);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const pushToast = useUIStore((state) => state.pushToast);
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const adjacency = useMemo(() => buildAdjacency(graph), [graph]);

  if (!menu) return null;

  const node = menu.targetId ? graph.nodes.find((item) => item.id === menu.targetId) : null;
  const edge = menu.targetId ? graph.edges.find((item) => item.id === menu.targetId) : null;
  const actions = useGraphStore.getState();
  const items: MenuItem[] = [];

  if (menu.target === 'node' && node) {
    items.push(
      { id: 'focus', label: 'Focus node', icon: <Focus size={13} />, shortcut: 'F', onSelect: () => actions.setFocus(node.id) },
      { id: 'duplicate', label: 'Duplicate node', icon: <Copy size={13} />, onSelect: () => { const id = actions.duplicateNode(node.id); if (id) pushToast({ kind: 'success', title: 'Node duplicated' }); } },
      { id: 'pin', label: node.pinned ? 'Unpin position' : 'Pin position', icon: <Pin size={13} />, onSelect: () => actions.togglePin(node.id) },
      { id: 'connect', label: 'Connect from here', icon: <Waypoints size={13} />, shortcut: 'G', onSelect: () => { actions.setConnectionSource(node.id); setActiveTool('connect'); } },
      { id: 'neighbors', label: `Select ${adjacency.degree.get(node.id) ?? 0} neighbors`, icon: <Crosshair size={13} />, disabled: !(adjacency.degree.get(node.id) ?? 0), onSelect: () => actions.selectNodes((adjacency.all.get(node.id) ?? []).map((ref) => ref.other)) },
      { id: 'delete', label: 'Delete node', icon: <Trash2 size={13} />, danger: true, onSelect: () => actions.deleteNodes([node.id]) },
    );
  } else if (menu.target === 'edge' && edge) {
    items.push(
      { id: 'select', label: 'Select relationship', icon: <Link2 size={13} />, onSelect: () => actions.selectEdge(edge.id) },
      { id: 'focus-source', label: 'Focus source', icon: <Focus size={13} />, onSelect: () => actions.setFocus(edge.source) },
      { id: 'focus-target', label: 'Focus target', icon: <Focus size={13} />, onSelect: () => actions.setFocus(edge.target) },
      { id: 'delete', label: 'Delete relationship', icon: <Unlink size={13} />, danger: true, onSelect: () => actions.deleteEdge(edge.id) },
    );
  } else if (menu.target === 'cluster') {
    items.push(
      { id: 'search', label: 'Search knowledge', icon: <Search size={13} />, onSelect: () => setSearchOpen(true) },
      { id: 'focus', label: 'Reset focus', icon: <Focus size={13} />, onSelect: () => actions.setFocus(null) },
    );
  } else {
    items.push(
      { id: 'create', label: 'Create node here', icon: <CirclePlus size={13} />, shortcut: 'N', onSelect: () => actions.createNode({ title: 'New concept' }) },
      { id: 'search', label: 'Search knowledge', icon: <Search size={13} />, onSelect: () => setSearchOpen(true) },
      { id: 'import', label: 'Import knowledge', icon: <Upload size={13} />, onSelect: () => openModal('import') },
      { id: 'export', label: 'Export knowledge', icon: <Download size={13} />, onSelect: () => openModal('export') },
      { id: 'settings', label: 'Graph settings', icon: <Settings2 size={13} />, onSelect: () => openModal('settings') },
    );
  }

  return <ContextMenu state={menu} items={items} onClose={closeContextMenu} title={node?.title ?? (edge ? 'Relationship' : 'Universe')} />;
}
