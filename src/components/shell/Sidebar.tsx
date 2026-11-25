import { useState } from 'react';
import { ChevronRight, CircleDot, Folder, Hash, Layers, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useGraphStore, useActiveWorkspace } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { collectAllTags } from '@/lib/graph/filters';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/states';
import { DEMO_DATASETS } from '@/data/demo';

export function Sidebar() {
  const workspace = useActiveWorkspace();
  const filters = useGraphStore((state) => state.filters);
  const setFilters = useGraphStore((state) => state.setFilters);
  const addCollection = useGraphStore((state) => state.addCollection);
  const updateCollection = useGraphStore((state) => state.updateCollection);
  const deleteCollection = useGraphStore((state) => state.deleteCollection);
  const loadDemo = useGraphStore((state) => state.loadDemo);
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const selectNodes = useGraphStore((state) => state.selectNodes);
  const [newCollection, setNewCollection] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const tags = collectAllTags(workspace.graph);
  const activeTags = filters.tags ?? [];

  return (
    <aside className="echo-sidebar flex h-full min-h-0 flex-col overflow-auto border-r border-[#1b1f24] bg-[#0b0d10]">
      <Panel
        title="Library"
        actions={<Button size="sm" variant="ghost" onClick={() => openModal('import')}>Import</Button>}
      >
        <div className="space-y-0.5 p-2">
          {[
            { label: 'All knowledge', icon: <Layers size={13} />, action: () => setFilters({}) },
            { label: 'Connected only', icon: <CircleDot size={13} />, action: () => setFilters({ ...filters, onlyConnected: true }) },
            { label: 'Workspaces', icon: <Folder size={13} />, action: () => openModal('workspace') },
            { label: 'Snapshots', icon: <Sparkles size={13} />, action: () => openModal('snapshot') },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.action} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200">
              <span className="text-zinc-600">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Collections"
        actions={<Button size="sm" variant="ghost" onClick={() => setNewCollection(true)}>+</Button>}
      >
        {newCollection && (
          <form className="flex gap-1 px-2 pb-2" onSubmit={(event) => {
            event.preventDefault();
            if (collectionName.trim()) { addCollection(collectionName.trim()); setCollectionName(''); setNewCollection(false); }
          }}>
            <input autoFocus value={collectionName} onChange={(event) => setCollectionName(event.target.value)} placeholder="Collection name" aria-label="Collection name" className="min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none focus:border-cyan-400/50" />
            <Button size="sm" variant="primary" type="submit">Add</Button>
          </form>
        )}
        {workspace.collections.length === 0 ? (
          <p className="px-3 pb-3 text-[11px] text-zinc-600">No collections yet. Group related nodes for focused exploration.</p>
        ) : (
          <div className="space-y-0.5 p-2">
            {workspace.collections.map((collection) => (
              <div
                key={collection.id}
                className={`flex items-center gap-1 rounded ${filters.collectionId === collection.id ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'}`}
              >
                {editingCollectionId === collection.id ? (
                  <form
                    className="flex min-w-0 flex-1 gap-1 py-1"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const name = editingCollectionName.trim();
                      if (name) updateCollection(collection.id, { name });
                      setEditingCollectionId(null);
                      setEditingCollectionName('');
                    }}
                  >
                    <input
                      autoFocus
                      aria-label={`Rename ${collection.name}`}
                      value={editingCollectionName}
                      onChange={(event) => setEditingCollectionName(event.target.value)}
                      className="min-w-0 flex-1 rounded border border-cyan-400/40 bg-black/40 px-2 py-1 text-xs outline-none"
                    />
                    <Button size="sm" variant="primary" type="submit" disabled={!editingCollectionName.trim()}>Save</Button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters({ ...filters, collectionId: filters.collectionId === collection.id ? null : collection.id });
                        selectNodes(workspace.graph.nodes.filter((node) => node.collectionIds.includes(collection.id)).map((node) => node.id));
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2 text-left text-xs"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: collection.color }} />
                      <span className="flex-1 truncate">{collection.name}</span>
                      <ChevronRight size={11} className="text-zinc-700" />
                    </button>
                    <IconButton
                      label={`Rename ${collection.name}`}
                      size="sm"
                      className="text-zinc-600 hover:text-zinc-200"
                      onClick={() => { setEditingCollectionId(collection.id); setEditingCollectionName(collection.name); }}
                    >
                      <Pencil size={11} />
                    </IconButton>
                    <IconButton
                      label={`Delete ${collection.name}`}
                      size="sm"
                      className="mr-1 text-zinc-600 hover:text-red-300"
                      onClick={() => openModal('confirm', {
                        confirmMessage: `Delete collection “${collection.name}”? Nodes will be kept.`,
                        confirmAction: () => {
                          deleteCollection(collection.id);
                          if (filters.collectionId === collection.id) setFilters({ ...filters, collectionId: null });
                          pushToast({ kind: 'info', title: `Deleted “${collection.name}”` });
                        },
                      })}
                    >
                      <Trash2 size={11} />
                    </IconButton>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Tags" subtitle={`${tags.length} in this universe`}>
        {tags.length === 0 ? (
          <EmptyState title="No tags yet" description="Add tags to nodes to build reusable filters and tag-based clusters." />
        ) : (
          <div className="flex flex-wrap gap-1.5 p-2.5">
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilters({ ...filters, tags: activeTags.includes(tag) ? activeTags.filter((value) => value !== tag) : [...activeTags, tag] })}
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] transition-colors ${activeTags.includes(tag) ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/[0.07] text-zinc-500 hover:border-white/20 hover:text-zinc-300'}`}
              >
                <Hash size={9} />{tag}<span className="font-mono text-zinc-600">{count}</span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Demo universes" collapsible defaultCollapsed>
        <div className="space-y-1 p-2">
          {DEMO_DATASETS.map((demo) => (
            <button
              key={demo.id}
              type="button"
              title={demo.description}
              onClick={() => {
                openModal('confirm', {
                  confirmMessage: `Replace the current universe with ${demo.name}? You can undo this action.`,
                  confirmAction: () => {
                    loadDemo(demo.id);
                    pushToast({ kind: 'success', title: `${demo.name} loaded`, detail: 'Use undo to restore the previous graph.' });
                  },
                });
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: demo.accent }} />
              <span className="flex-1 truncate">{demo.name}</span>
              <span className="font-mono text-[10px] text-zinc-700">{demo.topics.length}</span>
            </button>
          ))}
        </div>
      </Panel>
    </aside>
  );
}
