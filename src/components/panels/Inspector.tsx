import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Copy, Crosshair, Link2, Pin, Plus, Trash2, Waypoints } from 'lucide-react';
import type { NodeType, RelationshipType } from '@/types';
import { NODE_TYPES, RELATIONSHIP_TYPES } from '@/types';
import { NODE_TYPE_INFO, RELATIONSHIP_TYPE_INFO, importanceLabel } from '@/lib/graph/registry';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { connectedComponents } from '@/lib/graph/traverse';
import { computeStatistics } from '@/lib/graph/stats';
import { formatDateTime } from '@/lib/utils/time';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Select, Slider, TextArea, TextField, Toggle } from '@/components/ui/controls';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/states';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5 border-b border-white/[0.06] px-3 py-3 last:border-b-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">{title}</p>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-300">{value}</p>
    </div>
  );
}

export function Inspector() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId);
  const updateNode = useGraphStore((state) => state.updateNode);
  const updateEdge = useGraphStore((state) => state.updateEdge);
  const deleteNodes = useGraphStore((state) => state.deleteNodes);
  const deleteEdge = useGraphStore((state) => state.deleteEdge);
  const duplicateNode = useGraphStore((state) => state.duplicateNode);
  const togglePin = useGraphStore((state) => state.togglePin);
  const assignTag = useGraphStore((state) => state.assignTag);
  const unassignTag = useGraphStore((state) => state.unassignTag);
  const createNode = useGraphStore((state) => state.createNode);
  const setFocus = useGraphStore((state) => state.setFocus);
  const selectNode = useGraphStore((state) => state.selectNode);
  const selectEdge = useGraphStore((state) => state.selectEdge);
  const setConnectionSource = useGraphStore((state) => state.setConnectionSource);
  const setConnectionMode = useGraphStore((state) => state.setConnectionMode);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);

  const nodeId = selectedNodeIds[0] ?? null;
  const node = graph.nodes.find((item) => item.id === nodeId) ?? null;
  const edge = graph.edges.find((item) => item.id === selectedEdgeId) ?? null;
  const adjacency = useMemo(() => buildAdjacency(graph), [graph]);
  const stats = useMemo(() => computeStatistics(graph), [graph]);
  const components = useMemo(() => connectedComponents(graph), [graph]);
  const [referencesDraft, setReferencesDraft] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    setReferencesDraft(node?.references.join('\n') ?? '');
  }, [nodeId, node?.references]);

  const knownTags = useMemo(
    () => [...new Set([...graph.tags.map((tag) => tag.name), ...graph.nodes.flatMap((item) => item.tags)])].sort(),
    [graph],
  );
  const connections = node
    ? (adjacency.all.get(node.id) ?? []).map((ref) => ({ ...ref, outgoing: ref.edge.source === node.id }))
    : [];
  const componentSize = node ? (components.find((group) => group.includes(node.id))?.length ?? 1) : 0;
  const twoHopReach = node ? new Set(connections.flatMap((ref) => adjacency.all.get(ref.other) ?? [])).size : 0;
  const metadataEntries = node ? Object.entries(node.metadata) : [];

  const commitReferences = (): void => {
    if (!node) return;
    const references = referencesDraft.split('\n').map((line) => line.trim()).filter(Boolean);
    if (references.join('\n') !== node.references.join('\n')) updateNode(node.id, { references });
  };

  const handleDelete = (): void => {
    if (node) {
      openModal('confirm', {
        confirmMessage: `Delete “${node.title}” and its relationships? You can undo this action.`,
        confirmAction: () => {
          deleteNodes(selectedNodeIds);
          pushToast({ kind: 'success', title: 'Node deleted' });
        },
      });
    } else if (edge) {
      openModal('confirm', {
        confirmMessage: `Delete the “${edge.label}” relationship? You can undo this action.`,
        confirmAction: () => {
          deleteEdge(edge.id);
          pushToast({ kind: 'success', title: 'Relationship deleted' });
        },
      });
    }
  };

  const updateMetadataEntry = (index: number, key: string, value: string): void => {
    if (!node) return;
    const entries: [string, string | number | boolean | null][] = metadataEntries.map(([k, v]) => [k, v]);
    if (!entries[index]) return;
    entries[index] = [key, value || null];
    updateNode(node.id, { metadata: Object.fromEntries(entries) });
  };

  const addMetadata = (event: FormEvent): void => {
    event.preventDefault();
    const key = newKey.trim();
    if (!node || !key || key in node.metadata) return;
    updateNode(node.id, { metadata: { ...node.metadata, [key]: newValue.trim() || null } });
    setNewKey('');
    setNewValue('');
  };

  if (!node && !edge) {
    return (
      <Panel title="Inspector" subtitle="Nothing selected">
        <EmptyState
          icon={<Waypoints size={26} strokeWidth={1.2} />}
          title="Select something to inspect"
          description="Click a node or relationship to edit its properties, connections and metadata."
          action={<Button variant="primary" size="sm" onClick={() => createNode({ title: 'New concept', type: 'concept' })}>Create a node</Button>}
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Inspector"
      subtitle={node ? `${node.type}${selectedNodeIds.length > 1 ? ` · +${selectedNodeIds.length - 1} selected` : ''}` : 'Relationship'}
      actions={node ? (
        <Button size="sm" variant="ghost" icon={<Pin size={12} />} onClick={() => togglePin(node.id)} title={node.pinned ? 'Unpin node' : 'Pin node'}>
          {node.pinned ? 'Pinned' : 'Pin'}
        </Button>
      ) : undefined}
    >
      {node ? (
        <>
          <Section title="Identity">
            <TextField label="Title" value={node.title} onChange={(event) => updateNode(node.id, { title: event.target.value })} />
            <Select label="Type" value={node.type} onChange={(event) => updateNode(node.id, { type: event.target.value as NodeType })}>
              {NODE_TYPES.map((type) => <option key={type} value={type}>{NODE_TYPE_INFO[type].label}</option>)}
            </Select>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Color</span>
              <ColorPicker value={node.color ?? NODE_TYPE_INFO[node.type].color} onChange={(color) => updateNode(node.id, { color })} />
            </div>
            <TextArea label="Description" value={node.description} rows={4} placeholder="What do you know about this?" onChange={(event) => updateNode(node.id, { description: event.target.value })} />
            <Slider
              label="Importance"
              value={node.importance}
              min={0}
              max={1}
              step={0.05}
              display={`${importanceLabel(node.importance)} · ${Math.round(node.importance * 100)}%`}
              onChange={(importance) => updateNode(node.id, { importance })}
            />
            <TextField label="Source" value={node.source ?? ''} placeholder="URL, book, conversation…" onChange={(event) => updateNode(node.id, { source: event.target.value })} />
            <TextArea
              label="References (one per line)"
              value={referencesDraft}
              rows={3}
              placeholder="Related source or citation"
              onChange={(event) => setReferencesDraft(event.target.value)}
              onBlur={commitReferences}
            />
          </Section>

          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {node.tags.length === 0 && <span className="text-[11px] text-zinc-600">No tags assigned.</span>}
              {node.tags.map((tag) => <Chip key={tag} label={tag} onRemove={() => unassignTag(node.id, tag)} />)}
            </div>
            <form className="flex gap-1.5" onSubmit={(event) => {
              event.preventDefault();
              const tag = newTag.trim();
              if (!tag) return;
              if (!node.tags.includes(tag)) assignTag(node.id, tag);
              setNewTag('');
            }}>
              <TextField aria-label="New tag" list="inspector-tags" placeholder="Add a tag…" value={newTag} onChange={(event) => setNewTag(event.target.value)} />
              <datalist id="inspector-tags">{knownTags.map((tag) => <option key={tag} value={tag} />)}</datalist>
              <Button size="sm" type="submit" icon={<Plus size={11} />}>Add</Button>
            </form>
          </Section>

          <Section title="Metadata">
            {metadataEntries.map(([key, value], index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                <TextField aria-label="Metadata key" value={key} onChange={(event) => updateMetadataEntry(index, event.target.value, String(value ?? ''))} />
                <TextField aria-label="Metadata value" value={value === null ? '' : String(value)} onChange={(event) => updateMetadataEntry(index, key, event.target.value)} />
                <Button size="sm" variant="ghost" aria-label={`Remove ${key}`} icon={<Trash2 size={11} />} onClick={() => {
                  const next = { ...node.metadata };
                  delete next[key];
                  updateNode(node.id, { metadata: next });
                }} />
              </div>
            ))}
            <form className="grid grid-cols-[1fr_1fr_auto] gap-1.5" onSubmit={addMetadata}>
              <TextField aria-label="New metadata key" placeholder="Key" value={newKey} onChange={(event) => setNewKey(event.target.value)} />
              <TextField aria-label="New metadata value" placeholder="Value" value={newValue} onChange={(event) => setNewValue(event.target.value)} />
              <Button size="sm" type="submit" aria-label="Add metadata" icon={<Plus size={11} />} />
            </form>
          </Section>

          <Section title="Structure">
            <div className="grid grid-cols-2 gap-1.5">
              <Info label="Degree" value={adjacency.degree.get(node.id) ?? 0} />
              <Info label="Cluster size" value={componentSize} />
              <Info label="2-hop reach" value={twoHopReach} />
              <Info label="Clusters in graph" value={stats.clusterCount} />
              <Info label="Created" value={formatDateTime(node.createdAt)} />
              <Info label="Updated" value={formatDateTime(node.updatedAt)} />
            </div>
          </Section>

          <Section title={`Connections (${connections.length})`}>
            {connections.length === 0 && <p className="text-[11px] text-zinc-600">No relationships yet. Use Connect to link this node.</p>}
            <div className="space-y-1">
              {connections.map((ref) => {
                const other = graph.nodes.find((item) => item.id === ref.other);
                const type = RELATIONSHIP_TYPE_INFO[ref.edge.type];
                return (
                  <div key={ref.edge.id} className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                    <button type="button" onClick={() => selectNode(ref.other)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: type.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-zinc-300">{other?.title ?? ref.other}</span>
                        <span className="block truncate text-[9px] text-zinc-600">{ref.outgoing ? '→' : '←'} {ref.edge.label || type.label}</span>
                      </span>
                    </button>
                    <Button size="sm" variant="ghost" aria-label="Edit relationship" title="Edit relationship" icon={<Link2 size={11} />} onClick={() => selectEdge(ref.edge.id)} />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Actions">
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" icon={<Copy size={12} />} onClick={() => { const id = duplicateNode(node.id); if (id) pushToast({ kind: 'success', title: 'Node duplicated' }); }}>Duplicate</Button>
              <Button size="sm" icon={<Crosshair size={12} />} onClick={() => { setFocus(node.id); pushToast({ kind: 'info', title: 'Focused in graph' }); }}>Focus</Button>
              <Button size="sm" icon={<Waypoints size={12} />} onClick={() => {
                setConnectionSource(node.id);
                setConnectionMode(true);
                setActiveTool('connect');
                pushToast({ kind: 'info', title: 'Choose a node to connect', detail: 'Press Escape to cancel.' });
              }}>Connect</Button>
              <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={handleDelete}>Delete</Button>
            </div>
          </Section>
        </>
      ) : edge ? (
        <>
          <Section title="Relationship">
            <div className="space-y-1.5 rounded border border-white/[0.06] bg-white/[0.02] p-2 text-[11px]">
              <button type="button" className="block w-full truncate text-left text-cyan-200 hover:underline" onClick={() => selectNode(edge.source)}>
                From: {graph.nodes.find((item) => item.id === edge.source)?.title ?? edge.source}
              </button>
              <button type="button" className="block w-full truncate text-left text-cyan-200 hover:underline" onClick={() => selectNode(edge.target)}>
                To: {graph.nodes.find((item) => item.id === edge.target)?.title ?? edge.target}
              </button>
            </div>
            <TextField label="Label" value={edge.label} onChange={(event) => updateEdge(edge.id, { label: event.target.value })} />
            <Select label="Type" value={edge.type} onChange={(event) => updateEdge(edge.id, { type: event.target.value as RelationshipType })}>
              {RELATIONSHIP_TYPES.map((type) => <option key={type} value={type}>{RELATIONSHIP_TYPE_INFO[type].label}</option>)}
            </Select>
            <Toggle label="Directed" checked={edge.directed} onChange={(directed) => updateEdge(edge.id, { directed })} hint="Direction matters for this relationship" />
            <Slider label="Strength" value={edge.strength} min={0} max={1} step={0.05} onChange={(strength) => updateEdge(edge.id, { strength })} />
            <TextArea label="Description" value={edge.description ?? ''} rows={3} onChange={(event) => updateEdge(edge.id, { description: event.target.value })} />
          </Section>
          <Section title="Details">
            <div className="grid grid-cols-2 gap-1.5">
              <Info label="Created" value={formatDateTime(edge.createdAt)} />
              <Info label="Updated" value={formatDateTime(edge.updatedAt)} />
            </div>
          </Section>
          <Section title="Actions">
            <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={handleDelete}>Delete relationship</Button>
          </Section>
        </>
      ) : null}
    </Panel>
  );
}

export default Inspector;
