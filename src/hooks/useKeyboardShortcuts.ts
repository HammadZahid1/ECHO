import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const modifier = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
      const ui = useUIStore.getState();
      const graph = useGraphStore.getState();

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        ui.setCommandPalette(!ui.commandPaletteOpen);
        return;
      }
      if (event.key === 'Escape') {
        ui.closeOverlays();
        graph.selectNode(null);
        return;
      }
      if (typing) return;

      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) graph.redo();
        else graph.undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        graph.redo();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (graph.selectedNodeIds.length > 0) {
          event.preventDefault();
          graph.deleteNodes(graph.selectedNodeIds);
        } else if (graph.selectedEdgeId) {
          event.preventDefault();
          graph.deleteEdge(graph.selectedEdgeId);
        }
        return;
      }
      if (event.key.toLowerCase() === 'f' && graph.selectedNodeIds[0]) {
        event.preventDefault();
        graph.setFocus(graph.selectedNodeIds[0]);
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        graph.createNode({ title: 'New concept', type: 'concept' });
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        ui.setActiveTool(ui.activeTool === 'connect' ? 'select' : 'connect');
        return;
      }
      if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        ui.togglePanel('inspector');
        return;
      }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        ui.openModal('shortcuts');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
