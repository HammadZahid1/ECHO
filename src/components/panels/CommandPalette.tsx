import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, Command, CornerDownLeft, Search, Sparkles } from 'lucide-react';
import type { CommandAction, LayoutKind, PanelId, SearchResult, ViewMode } from '@/types';
import { LAYOUT_LABELS, NODE_TYPE_INFO, VIEW_LABELS } from '@/lib/graph/registry';
import { createSearchEngine } from '@/lib/search';
import { filterCommands } from '@/lib/search/fuzzy';
import { highlightSegments } from '@/lib/search/highlight';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';

const VIEWS = Object.keys(VIEW_LABELS) as ViewMode[];
const LAYOUTS = Object.keys(LAYOUT_LABELS) as LayoutKind[];
const PANELS: { id: PanelId; label: string }[] = [
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'inspector', label: 'Inspector' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'tools', label: 'Tools' },
  { id: 'status', label: 'Status bar' },
];

type PaletteItem = { kind: 'command'; command: CommandAction } | { kind: 'node'; result: SearchResult };

function action(
  id: string,
  title: string,
  group: string,
  keywords: string[],
  run: () => void,
  shortcut?: string,
  disabled = false,
): CommandAction {
  return { id, title, group, keywords, run, shortcut, disabled };
}

export function CommandPalette() {
  const open = useUIStore((state) => state.commandPaletteOpen);
  const setCommandPalette = useUIStore((state) => state.setCommandPalette);
  const setView = useUIStore((state) => state.setView);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const togglePanel = useUIStore((state) => state.togglePanel);
  const panelVisibility = useUIStore((state) => state.panelVisibility);
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);

  const createNode = useGraphStore((state) => state.createNode);
  const createEdge = useGraphStore((state) => state.createEdge);
  const setFocus = useGraphStore((state) => state.setFocus);
  const setLayoutSettings = useGraphStore((state) => state.setLayoutSettings);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  const canUndo = useGraphStore((state) => state.canUndo());
  const canRedo = useGraphStore((state) => state.canRedo());
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useMemo(() => createSearchEngine(graph), [graph]);

  const commands = useMemo<CommandAction[]>(() => [
    action('create-node', 'Create node', 'Create', ['new', 'concept', 'node'], () => {
      const id = createNode({ title: 'New concept', type: 'concept' });
      setFocus(id);
    }, 'N'),
    action('create-idea', 'Create idea', 'Create', ['new', 'idea', 'note'], () => createNode({ title: 'New idea', type: 'idea' })),
    action('connect', 'Connect selected nodes', 'Create', ['edge', 'link', 'relationship'], () => {
      const [source, target] = selectedNodeIds;
      if (source && target && createEdge(source, target)) pushToast({ kind: 'success', title: 'Nodes connected' });
    }, 'G', selectedNodeIds.length < 2),
    ...VIEWS.map((view) => action(`view-${view}`, `View: ${VIEW_LABELS[view]}`, 'Navigate', ['view', 'open', VIEW_LABELS[view]], () => setView(view))),
    action('focus-node', 'Focus selected node', 'Navigate', ['focus', 'center', 'zoom'], () => {
      const id = selectedNodeIds[0] ?? null;
      setFocus(id);
      if (id) setView('universe');
    }, 'F', selectedNodeIds.length === 0),
    action('clear-focus', 'Reset graph focus', 'Navigate', ['focus', 'reset', 'clear'], () => setFocus(null)),
    ...LAYOUTS.map((kind) => action(`layout-${kind}`, `Layout: ${LAYOUT_LABELS[kind]}`, 'Layout', ['layout', 'arrange', LAYOUT_LABELS[kind]], () => setLayoutSettings({ kind }))),
    ...PANELS.map(({ id, label }) => action(`panel-${id}`, `${panelVisibility[id] ? 'Hide' : 'Show'} ${label} panel`, 'Panels', ['panel', 'toggle', 'show', 'hide', label], () => togglePanel(id))),
    action('undo', 'Undo last change', 'History', ['undo', 'revert'], undo, 'Ctrl+Z', !canUndo),
    action('redo', 'Redo last change', 'History', ['redo', 'repeat'], redo, 'Ctrl+Shift+Z', !canRedo),
    action('import', 'Import knowledge', 'Data & tools', ['import', 'load', 'upload'], () => openModal('import')),
    action('export', 'Export knowledge', 'Data & tools', ['export', 'save', 'download'], () => openModal('export')),
    action('snapshot', 'Create snapshot', 'Data & tools', ['snapshot', 'backup', 'save'], () => openModal('snapshot')),
    action('workspaces', 'Manage workspaces', 'Data & tools', ['workspace', 'switch', 'library'], () => openModal('workspace')),
    action('compare', 'Compare snapshots', 'Data & tools', ['compare', 'diff'], () => openModal('compare')),
    action('search', 'Open search', 'Data & tools', ['search', 'find', 'query'], () => setSearchOpen(true), 'Ctrl+K'),
    action('shortcuts', 'Keyboard shortcuts', 'Data & tools', ['shortcuts', 'help', 'keys'], () => openModal('shortcuts'), '?'),
    action('settings', 'Open settings', 'Data & tools', ['settings', 'preferences', 'theme'], () => openModal('settings')),
    action('tools', 'Toggle tools panel', 'Data & tools', ['tools', 'panel', 'utilities'], () => togglePanel('tools')),
  ], [createNode, createEdge, setFocus, setView, setLayoutSettings, selectedNodeIds, pushToast, togglePanel, panelVisibility, undo, redo, canUndo, canRedo, openModal, setSearchOpen]);

  const filtered = useMemo(() => filterCommands(commands, query, 14), [commands, query]);
  const nodeResults = useMemo(() => query.trim() ? engine.quick(query, 5) : [], [engine, query]);
  const items = useMemo<PaletteItem[]>(() => [
    ...filtered.map((command) => ({ kind: 'command' as const, command })),
    ...nodeResults.map((result) => ({ kind: 'node' as const, result })),
  ], [filtered, nodeResults]);
  const grouped = useMemo(() => {
    const groups = new Map<string, CommandAction[]>();
    for (const command of filtered) groups.set(command.group, [...(groups.get(command.group) ?? []), command]);
    return [...groups.entries()];
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);
  useEffect(() => { setActiveIndex(0); }, [query]);

  const runItem = (item: PaletteItem): void => {
    setCommandPalette(false);
    if (item.kind === 'command') {
      item.command.run();
    } else {
      useGraphStore.getState().selectNode(item.result.nodeId);
      setFocus(item.result.nodeId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) runItem(item);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setCommandPalette(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Command palette"
      description="Search actions or jump directly to a knowledge node"
      width="max-w-xl"
      onClose={() => setCommandPalette(false)}
    >
      <div onKeyDown={handleKeyDown} className="-mx-2">
        <div className="flex items-center gap-2 border-b border-white/10 px-2 pb-3">
          <Command size={15} className="shrink-0 text-cyan-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command or search knowledge…"
            aria-label="Command palette search"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">esc</kbd>
        </div>

        {items.length === 0 && <p className="px-3 py-8 text-center text-xs text-zinc-600">No commands or nodes match “{query}”.</p>}

        <div className="max-h-[52vh] overflow-auto pt-2">
          {grouped.map(([group, groupCommands]) => (
            <div key={group} className="mb-2">
              <p className="px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">{group}</p>
              {groupCommands.map((command) => {
                const index = items.findIndex((item) => item.kind === 'command' && item.command.id === command.id);
                return (
                  <button
                    key={command.id}
                    type="button"
                    disabled={command.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runItem({ kind: 'command', command })}
                    className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs transition-colors disabled:opacity-35 ${index === activeIndex ? 'bg-cyan-400/10 text-cyan-100' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'}`}
                  >
                    <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
                    <span className="flex-1 truncate">{command.title}</span>
                    {command.shortcut && <span className="font-mono text-[10px] text-zinc-700">{command.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          {nodeResults.length > 0 && (
            <div className="mb-2">
              <p className="flex items-center gap-1.5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600"><Sparkles size={10} /> Knowledge nodes</p>
              {nodeResults.map((result, offset) => {
                const index = filtered.length + offset;
                const info = NODE_TYPE_INFO[result.nodeType];
                return (
                  <button
                    key={result.nodeId}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runItem({ kind: 'node', result })}
                    className={`flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left transition-colors ${index === activeIndex ? 'bg-cyan-400/10' : 'hover:bg-white/[0.04]'}`}
                  >
                    <span className="text-[12px]" style={{ color: info.color }}>{info.glyph}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">
                      {highlightSegments(result.title, query).map((segment, segmentIndex) => segment.match
                        ? <mark key={segmentIndex} className="bg-cyan-400/20 text-cyan-200">{segment.text}</mark>
                        : <span key={segmentIndex}>{segment.text}</span>)}
                    </span>
                    <span className="text-[9px] text-zinc-600">{info.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-white/[0.07] px-3 pt-2 text-[9px] text-zinc-700">
          <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> run</span>
          <span className="ml-auto flex items-center gap-1"><Search size={10} /> {items.length} matches</span>
        </div>
      </div>
    </Modal>
  );
}

export default CommandPalette;
