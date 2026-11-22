import { create } from 'zustand';
import type {
  CameraState,
  GraphCollection,
  GraphData,
  GraphHistory,
  GraphLayoutSettings,
  GraphSettings,
  GraphSnapshot,
  GraphWorkspace,
  HistoryActionKind,
  KnowledgeEdge,
  KnowledgeNode,
  Vec3,
} from '@/types';
import type { GraphFilterState } from '@/lib/graph/filters';
import { cloneGraph, createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import * as ops from '@/lib/graph/operations';
import { createDebouncedSaver, loadWorkspaces, saveWorkspace, deleteWorkspace as removePersistedWorkspace } from '@/lib/persistence/repository';
import { createDemoGraph, DEMO_DATASETS } from '@/data/demo';
import { createId } from '@/lib/utils/id';
import { canRedo, canUndo, pushHistory, redoEntry, trimHistory, undoEntry } from './history';

const debouncedSave = createDebouncedSaver(700, {
  onSaved: () => useGraphStore.setState({ storageStatus: 'saved', storageMessage: '' }),
  onError: (error) => useGraphStore.setState({
    storageStatus: 'error',
    storageMessage: error instanceof Error ? error.message : 'Failed to save locally',
  }),
});

interface GraphState {
  workspaces: GraphWorkspace[];
  activeWorkspaceId: string;
  histories: Record<string, GraphHistory>;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  connectionSourceId: string | null;
  connectionMode: boolean;
  filters: GraphFilterState;
  storageStatus: 'idle' | 'loading' | 'saved' | 'error';
  storageMessage: string;
  initialized: boolean;

  initialize: () => Promise<void>;
  createWorkspace: (name: string, demoId?: string) => string;
  deleteWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  duplicateWorkspace: (id: string) => string | null;
  setWorkspaceColor: (id: string, color: string) => void;

  createNode: (patch?: Partial<KnowledgeNode>) => string;
  updateNode: (id: string, patch: Partial<KnowledgeNode>, label?: string) => void;
  deleteNodes: (ids: string[]) => void;
  duplicateNode: (id: string) => string | null;
  moveNode: (id: string, position: Vec3, record?: boolean) => void;
  batchMoveNodes: (positions: Map<string, Vec3>) => void;
  togglePin: (id: string) => void;
  assignTag: (id: string, tag: string) => void;
  unassignTag: (id: string, tag: string) => void;

  createEdge: (source: string, target: string, patch?: Partial<KnowledgeEdge>) => string | null;
  updateEdge: (id: string, patch: Partial<KnowledgeEdge>) => void;
  deleteEdge: (id: string) => void;

  selectNode: (id: string | null, additive?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  selectEdge: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  setFocus: (id: string | null) => void;
  setConnectionSource: (id: string | null) => void;
  setConnectionMode: (enabled: boolean) => void;
  setFilters: (filters: GraphFilterState) => void;
  clearFilters: () => void;

  commitGraph: (graph: GraphData, kind: HistoryActionKind, label: string, nodeIds?: string[], edgeIds?: string[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  setSettings: (settings: Partial<GraphSettings>) => void;
  setLayoutSettings: (settings: Partial<GraphLayoutSettings>) => void;
  applyLayoutPositions: (positions: Map<string, Vec3>, label?: string) => void;
  setCamera: (camera: Partial<CameraState>) => void;

  createSnapshot: (name: string, description?: string) => string | null;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;

  addCollection: (name: string, parentId?: string | null) => string;
  updateCollection: (id: string, patch: Partial<GraphCollection>) => void;
  deleteCollection: (id: string) => void;
  toggleNodeCollection: (nodeId: string, collectionId: string) => void;

  importGraphIntoActive: (graph: GraphData, label?: string) => void;
  replaceActiveGraph: (graph: GraphData, label?: string) => void;
  loadDemo: (demoId: string) => void;
  persistNow: () => Promise<void>;
}

function seedWorkspace(): GraphWorkspace {
  const demo = createDemoGraph('software-engineering') ?? DEMO_DATASETS[0]?.create() ?? { nodes: [], edges: [], tags: [] };
  return createWorkspace({ name: 'Software Engineering', description: 'A curated starter universe', graph: demo });
}

const initialWorkspace = seedWorkspace();
const initialHistories: Record<string, GraphHistory> = { [initialWorkspace.id]: createHistory() };

export const useGraphStore = create<GraphState>()((set, get) => {
  const activeWorkspace = (): GraphWorkspace => {
    const state = get();
    return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0] ?? initialWorkspace;
  };

  const updateActive = (
    updater: (workspace: GraphWorkspace) => GraphWorkspace,
    kind?: HistoryActionKind,
    label?: string,
    nodeIds: string[] = [],
    edgeIds: string[] = [],
  ): void => {
    const state = get();
    const current = activeWorkspace();
    const next = updater(current);
    if (next === current) return;
    const histories = state.histories;
    let history = histories[current.id] ?? createHistory();
    if (kind && label) {
      history = pushHistory(history, kind, label, current.graph, next.graph, nodeIds, edgeIds);
      history = trimHistory(history, 120);
    }
    const workspaces = state.workspaces.map((workspace) => (workspace.id === next.id ? next : workspace));
    set({
      workspaces,
      histories: { ...histories, [current.id]: history },
      storageStatus: 'loading',
    });
    debouncedSave(next);
  };

  const updateGraph = (
    mutator: (graph: GraphData) => GraphData,
    kind?: HistoryActionKind,
    label?: string,
    nodeIds?: string[],
    edgeIds?: string[],
  ): void => {
    updateActive((workspace) => {
      const graph = mutator(workspace.graph);
      if (graph === workspace.graph) return workspace;
      return { ...workspace, graph, updatedAt: Date.now() };
    }, kind, label, nodeIds, edgeIds);
  };

  return {
    workspaces: [initialWorkspace],
    activeWorkspaceId: initialWorkspace.id,
    histories: initialHistories,
    selectedNodeIds: [],
    selectedEdgeId: null,
    hoveredNodeId: null,
    focusedNodeId: null,
    connectionSourceId: null,
    connectionMode: false,
    filters: {},
    storageStatus: 'idle',
    storageMessage: '',
    initialized: false,

    initialize: async () => {
      if (get().initialized) return;
      set({ storageStatus: 'loading', initialized: true });
      const result = await loadWorkspaces();
      if (result.workspaces.length === 0) {
        void saveWorkspace(initialWorkspace).catch(() => undefined);
        set({ storageStatus: result.available ? 'saved' : 'error', storageMessage: result.issues.join(' · ') });
        return;
      }
      const histories = { ...get().histories };
      for (const workspace of result.workspaces) histories[workspace.id] ??= createHistory();
      set({
        workspaces: result.workspaces,
        activeWorkspaceId: result.workspaces[0].id,
        histories,
        storageStatus: result.issues.length > 0 ? 'error' : 'saved',
        storageMessage: result.issues.join(' · '),
      });
    },

    createWorkspace: (name, demoId) => {
      const graph = demoId ? createDemoGraph(demoId) ?? { nodes: [], edges: [], tags: [] } : { nodes: [], edges: [], tags: [] };
      const workspace = createWorkspace({ name, graph });
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        activeWorkspaceId: workspace.id,
        histories: { ...state.histories, [workspace.id]: createHistory() },
        selectedNodeIds: [],
      }));
      void saveWorkspace(workspace).catch(() => undefined);
      return workspace.id;
    },

    deleteWorkspace: (id) => {
      const state = get();
      if (state.workspaces.length <= 1) return;
      const workspaces = state.workspaces.filter((workspace) => workspace.id !== id);
      const histories = { ...state.histories };
      delete histories[id];
      set({
        workspaces,
        histories,
        activeWorkspaceId: state.activeWorkspaceId === id ? workspaces[0].id : state.activeWorkspaceId,
        selectedNodeIds: [],
      });
      void removePersistedWorkspace(id).catch(() => undefined);
    },

    switchWorkspace: (id) => {
      if (!get().workspaces.some((workspace) => workspace.id === id)) return;
      set({ activeWorkspaceId: id, selectedNodeIds: [], selectedEdgeId: null, filters: {}, focusedNodeId: null });
    },

    renameWorkspace: (id, name) => {
      set((state) => ({
        workspaces: state.workspaces.map((workspace) => workspace.id === id ? { ...workspace, name, updatedAt: Date.now() } : workspace),
      }));
      const workspace = get().workspaces.find((item) => item.id === id);
      if (workspace) void saveWorkspace(workspace).catch(() => undefined);
    },

    duplicateWorkspace: (id) => {
      const source = get().workspaces.find((workspace) => workspace.id === id);
      if (!source) return null;
      const copy = createWorkspace({
        ...source,
        id: createId('workspace'),
        name: `${source.name} copy`,
        graph: cloneGraph(source.graph),
        snapshots: source.snapshots.map((snapshot) => ({ ...snapshot, id: createId('snapshot') })),
        collections: source.collections.map((collection) => ({ ...collection, id: createId('collection') })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      set((state) => ({
        workspaces: [...state.workspaces, copy],
        histories: { ...state.histories, [copy.id]: createHistory() },
        activeWorkspaceId: copy.id,
      }));
      void saveWorkspace(copy).catch(() => undefined);
      return copy.id;
    },

    setWorkspaceColor: (id, color) => {
      set((state) => ({ workspaces: state.workspaces.map((workspace) => workspace.id === id ? { ...workspace, color } : workspace) }));
    },

    createNode: (patch) => {
      const node = createNode(patch);
      updateGraph((graph) => ops.addNode(graph, node), 'node.add', `Create ${node.title}`, [node.id]);
      set({ selectedNodeIds: [node.id], selectedEdgeId: null });
      return node.id;
    },

    updateNode: (id, patch, label) => {
      const node = activeWorkspace().graph.nodes.find((item) => item.id === id);
      updateGraph(
        (graph) => ops.updateNode(graph, id, patch),
        patch.color !== undefined ? 'node.color' : patch.type !== undefined ? 'node.type' : patch.tags !== undefined ? 'node.tag' : 'node.update',
        label ?? `Edit ${node?.title ?? 'node'}`,
        [id],
      );
    },

    deleteNodes: (ids) => {
      if (ids.length === 0) return;
      updateGraph((graph) => ids.reduce((current, id) => ops.removeNode(current, id), graph), 'node.remove', `Delete ${ids.length} node${ids.length > 1 ? 's' : ''}`, ids);
      set((state) => ({ selectedNodeIds: state.selectedNodeIds.filter((id) => !ids.includes(id)) }));
    },

    duplicateNode: (id) => {
      let newId: string | null = null;
      updateGraph((graph) => {
        const result = ops.duplicateNode(graph, id);
        newId = result.newId;
        return result.graph;
      }, 'node.add', 'Duplicate node', [id]);
      if (newId) set({ selectedNodeIds: [newId] });
      return newId;
    },

    moveNode: (id, position, record = false) => {
      updateGraph(
        (graph) => ops.moveNode(graph, id, position),
        record ? 'node.move' : undefined,
        record ? 'Move node' : undefined,
        [id],
      );
    },

    batchMoveNodes: (positions) => {
      updateGraph((graph) => ops.setNodePositions(graph, positions));
    },

    togglePin: (id) => updateGraph((graph) => ops.togglePin(graph, id), 'node.pin', 'Toggle pin', [id]),

    assignTag: (id, tag) => updateGraph((graph) => ops.assignTag(graph, id, tag), 'node.tag', `Tag ${tag}`, [id]),
    unassignTag: (id, tag) => updateGraph((graph) => ops.unassignTag(graph, id, tag), 'node.tag', `Remove tag ${tag}`, [id]),

    createEdge: (source, target, patch) => {
      const edge = createEdge(source, target, patch);
      let created = false;
      updateGraph((graph) => {
        const next = ops.addEdge(graph, edge);
        created = next !== graph;
        return next;
      }, 'edge.add', `Connect ${edge.label}`, [source, target], [edge.id]);
      if (created) set({ selectedEdgeId: edge.id, connectionSourceId: null, connectionMode: false });
      return created ? edge.id : null;
    },

    updateEdge: (id, patch) => updateGraph((graph) => ops.updateEdge(graph, id, patch), 'edge.update', 'Edit relationship', [], [id]),
    deleteEdge: (id) => {
      updateGraph((graph) => ops.removeEdge(graph, id), 'edge.remove', 'Delete relationship', [], [id]);
      if (get().selectedEdgeId === id) set({ selectedEdgeId: null });
    },

    selectNode: (id, additive = false) => {
      if (!id) {
        set({ selectedNodeIds: [], selectedEdgeId: null });
        return;
      }
      set((state) => {
        if (!additive) return { selectedNodeIds: [id], selectedEdgeId: null };
        return {
          selectedNodeIds: state.selectedNodeIds.includes(id)
            ? state.selectedNodeIds.filter((value) => value !== id)
            : [...state.selectedNodeIds, id],
          selectedEdgeId: null,
        };
      });
    },
    selectNodes: (ids) => set({ selectedNodeIds: ids, selectedEdgeId: null }),
    selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeIds: [] }),
    setHovered: (id) => set({ hoveredNodeId: id }),
    setFocus: (id) => set({ focusedNodeId: id }),
    setConnectionSource: (id) => set({ connectionSourceId: id }),
    setConnectionMode: (enabled) => set({ connectionMode: enabled, connectionSourceId: enabled ? get().connectionSourceId : null }),
    setFilters: (filters) => set({ filters }),
    clearFilters: () => set({ filters: {} }),

    commitGraph: (graph, kind, label, nodeIds, edgeIds) => updateGraph(() => graph, kind, label, nodeIds, edgeIds),

    undo: () => {
      const state = get();
      const workspace = activeWorkspace();
      const history = state.histories[workspace.id] ?? createHistory();
      const entry = history.entries[history.cursor];
      if (!entry) return;
      const nextHistory = undoEntry(history);
      updateActive((current) => ({ ...current, graph: cloneGraph(entry.before), updatedAt: Date.now() }));
      set((current) => ({ histories: { ...current.histories, [workspace.id]: nextHistory }, selectedNodeIds: [] }));
    },

    redo: () => {
      const state = get();
      const workspace = activeWorkspace();
      const history = state.histories[workspace.id] ?? createHistory();
      const entry = history.entries[history.cursor + 1];
      if (!entry) return;
      const nextHistory = redoEntry(history);
      updateActive((current) => ({ ...current, graph: cloneGraph(entry.after), updatedAt: Date.now() }));
      set((current) => ({ histories: { ...current.histories, [workspace.id]: nextHistory }, selectedNodeIds: [] }));
    },

    canUndo: () => {
      const state = get();
      return canUndo(state.histories[state.activeWorkspaceId] ?? createHistory());
    },
    canRedo: () => {
      const state = get();
      return canRedo(state.histories[state.activeWorkspaceId] ?? createHistory());
    },
    clearHistory: () => {
      const state = get();
      set({ histories: { ...state.histories, [state.activeWorkspaceId]: createHistory() } });
    },

    setSettings: (settings) => updateActive((workspace) => ({ ...workspace, settings: { ...workspace.settings, ...settings } })),
    setLayoutSettings: (settings) => updateActive((workspace) => ({
      ...workspace,
      settings: { ...workspace.settings, layout: { ...workspace.settings.layout, ...settings } },
    })),
    applyLayoutPositions: (positions, label = 'Apply layout') => {
      updateGraph((graph) => ({
        ...graph,
        nodes: graph.nodes.map((node) => {
          const position = positions.get(node.id);
          return position && !node.pinned ? { ...node, position: { ...position } } : node;
        }),
      }), 'graph.layout', label);
    },
    setCamera: (camera) => updateActive((workspace) => ({
      ...workspace,
      camera: { ...workspace.camera, ...camera },
    })),

    createSnapshot: (name, description) => {
      const workspace = activeWorkspace();
      const snapshot: GraphSnapshot = {
        id: createId('snapshot'),
        name,
        description: description ?? '',
        createdAt: Date.now(),
        graph: cloneGraph(workspace.graph),
        settings: structuredClone(workspace.settings),
        camera: structuredClone(workspace.camera),
      };
      updateActive((current) => ({ ...current, snapshots: [...current.snapshots, snapshot] }));
      return snapshot.id;
    },
    restoreSnapshot: (id) => {
      const snapshot = activeWorkspace().snapshots.find((item) => item.id === id);
      if (!snapshot) return;
      updateActive((workspace) => ({ ...workspace, graph: cloneGraph(snapshot.graph), settings: structuredClone(snapshot.settings), camera: structuredClone(snapshot.camera) }), 'snapshot.restore', `Restore ${snapshot.name}`);
    },
    deleteSnapshot: (id) => updateActive((workspace) => ({ ...workspace, snapshots: workspace.snapshots.filter((snapshot) => snapshot.id !== id) })),

    addCollection: (name, parentId = null) => {
      const collection: GraphCollection = {
        id: createId('collection'), name, description: '', color: '#4fd8e8', parentId,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      updateActive((workspace) => ({ ...workspace, collections: [...workspace.collections, collection] }), 'collection.add', `Create collection ${name}`);
      return collection.id;
    },
    updateCollection: (id, patch) => updateActive((workspace) => ({
      ...workspace,
      collections: workspace.collections.map((collection) => collection.id === id ? { ...collection, ...patch, updatedAt: Date.now() } : collection),
    }), 'collection.update', 'Update collection'),
    deleteCollection: (id) => {
      updateActive((workspace) => ({
        ...workspace,
        collections: workspace.collections.filter((collection) => collection.id !== id && collection.parentId !== id),
        graph: { ...workspace.graph, nodes: workspace.graph.nodes.map((node) => ({ ...node, collectionIds: node.collectionIds.filter((value) => value !== id) })) },
      }), 'collection.remove', 'Delete collection');
    },
    toggleNodeCollection: (nodeId, collectionId) => {
      updateGraph((graph) => ({
        ...graph,
        nodes: graph.nodes.map((node) => node.id === nodeId ? {
          ...node,
          collectionIds: node.collectionIds.includes(collectionId)
            ? node.collectionIds.filter((value) => value !== collectionId)
            : [...node.collectionIds, collectionId],
        } : node),
      }));
    },

    importGraphIntoActive: (graph, label = 'Import knowledge') => {
      updateGraph((current) => ({
        ...current,
        nodes: [...current.nodes, ...graph.nodes.filter((node) => !current.nodes.some((existing) => existing.id === node.id))],
        edges: [...current.edges, ...graph.edges.filter((edge) => !current.edges.some((existing) => existing.id === edge.id))],
        tags: [...current.tags, ...graph.tags.filter((tag) => !current.tags.some((existing) => existing.id === tag.id))],
      }), 'graph.import', label);
    },
    replaceActiveGraph: (graph, label = 'Replace graph') => {
      updateGraph(() => cloneGraph(graph), 'graph.import', label);
      set({ selectedNodeIds: [], selectedEdgeId: null });
    },
    loadDemo: (demoId) => {
      const graph = createDemoGraph(demoId);
      if (!graph) return;
      get().replaceActiveGraph(graph, `Load demo: ${DEMO_DATASETS.find((item) => item.id === demoId)?.name ?? demoId}`);
    },
    persistNow: async () => {
      const workspace = activeWorkspace();
      try {
        await saveWorkspace(workspace);
        set({ storageStatus: 'saved', storageMessage: '' });
      } catch (error) {
        set({ storageStatus: 'error', storageMessage: error instanceof Error ? error.message : 'Storage failed' });
      }
    },
  };
});

export function useActiveWorkspace(): GraphWorkspace {
  return useGraphStore((state) => state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0]);
}

export function useGraph(): GraphData {
  return useActiveWorkspace().graph;
}
