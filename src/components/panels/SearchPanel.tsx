import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, Clock, CornerDownLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import type { NodeType, SearchFilters, SearchHistoryEntry, SearchResult } from '@/types';
import { NODE_TYPES } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { collectAllTags } from '@/lib/graph/filters';
import { createSearchEngine, DEFAULT_SEARCH_FILTERS } from '@/lib/search';
import { highlightSegments } from '@/lib/search/highlight';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { createId } from '@/lib/utils/id';
import { formatRelativeTime } from '@/lib/utils/time';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { Panel } from '@/components/ui/Panel';
import { Select, Slider, Toggle } from '@/components/ui/controls';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/states';

interface SearchPanelProps {
  autoFocus?: boolean;
  className?: string;
  onClose?: () => void;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) => segment.match
        ? <mark key={index} className="rounded-sm bg-cyan-400/20 text-cyan-200">{segment.text}</mark>
        : <span key={index}>{segment.text}</span>)}
    </>
  );
}

export function SearchPanel({ autoFocus = false, className = '', onClose }: SearchPanelProps) {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const historyLimit = useSettingsStore((state) => state.searchHistoryLimit);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);

  const engine = useMemo(() => createSearchEngine(graph), [graph]);
  const debouncedQuery = useDebouncedValue(searchQuery, 180);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typeFilter, setTypeFilter] = useState<NodeType | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [minImportance, setMinImportance] = useState(0);
  const [onlyConnected, setOnlyConnected] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  const tagCounts = useMemo(() => collectAllTags(graph), [graph]);
  const filters = useMemo<SearchFilters>(() => ({
    ...DEFAULT_SEARCH_FILTERS,
    types: typeFilter === 'all' ? [] : [typeFilter],
    tags: activeTags,
    minImportance,
    onlyConnected,
  }), [typeFilter, activeTags, minImportance, onlyConnected]);

  const results = useMemo(
    () => engine.search({ text: debouncedQuery, filters, limit: 40 }),
    [engine, debouncedQuery, filters],
  );
  const suggestions = useMemo(
    () => searchQuery.trim() ? engine.suggest(searchQuery, 6) : [],
    [engine, searchQuery],
  );

  useEffect(() => { setActiveIndex(0); }, [debouncedQuery, filters]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const recordHistory = (text: string, resultCount: number): void => {
    const trimmed = text.trim();
    if (!trimmed) return;
    engine.recordSearch(trimmed, resultCount);
    setHistory((current) => [
      { id: createId('search'), text: trimmed, at: Date.now(), resultCount },
      ...current.filter((entry) => entry.text !== trimmed),
    ].slice(0, historyLimit));
  };

  const chooseResult = (result: SearchResult): void => {
    selectNode(result.nodeId);
    setFocus(result.nodeId);
    recordHistory(searchQuery || result.title, results.length);
    setSearchOpen(false);
    onClose?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) chooseResult(result);
      else recordHistory(searchQuery, results.length);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (searchQuery) setSearchQuery('');
      else { setSearchOpen(false); onClose?.(); }
    }
  };

  const clearFilters = (): void => {
    setTypeFilter('all');
    setActiveTags([]);
    setMinImportance(0);
    setOnlyConnected(false);
  };
  const hasFilters = typeFilter !== 'all' || activeTags.length > 0 || minImportance > 0 || onlyConnected;
  const query = debouncedQuery.trim();

  return (
    <Panel
      title="Search knowledge"
      subtitle={`${results.length} result${results.length === 1 ? '' : 's'}${query ? ` for “${query}”` : ''}`}
      className={className}
      bodyClassName="max-h-[62vh]"
      actions={<button type="button" aria-label="Toggle search filters" title="Toggle filters" onClick={() => setShowFilters((value) => !value)} className={`transition-colors ${showFilters ? 'text-cyan-300' : 'text-zinc-600 hover:text-zinc-300'}`}><SlidersHorizontal size={13} /></button>}
    >
      <div onKeyDown={handleKeyDown}>
        <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0e1013]/95 p-3 backdrop-blur">
          <div className="flex items-center gap-2 rounded-[6px] border border-white/10 bg-black/40 px-2.5 focus-within:border-cyan-400/50">
            <Search size={14} className="shrink-0 text-zinc-600" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search nodes, tags, metadata…"
              aria-label="Search knowledge"
              className="h-9 min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            {searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="text-zinc-600 hover:text-zinc-300"><X size={13} /></button>}
          </div>

          {showFilters && (
            <div className="mt-3 space-y-2.5 border-t border-white/[0.06] pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Select label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NodeType | 'all')}>
                  <option value="all">All types</option>
                  {NODE_TYPES.map((type) => <option key={type} value={type}>{NODE_TYPE_INFO[type].label}</option>)}
                </Select>
                <div className="flex flex-col justify-end"><Toggle label="Connected only" checked={onlyConnected} onChange={setOnlyConnected} /></div>
              </div>
              <Slider label="Minimum importance" value={minImportance} min={0} max={1} step={0.05} onChange={setMinImportance} />
              <div className="flex flex-wrap gap-1.5">
                {tagCounts.map(({ tag, count }) => (
                  <Chip
                    key={tag}
                    label={tag}
                    count={count}
                    selected={activeTags.includes(tag)}
                    onSelect={() => setActiveTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}
                  />
                ))}
              </div>
              {hasFilters && <button type="button" onClick={clearFilters} className="text-[10px] text-cyan-400/80 hover:text-cyan-200">Reset filters</button>}
            </div>
          )}
        </div>

        {!query && history.length > 0 && (
          <div className="border-b border-white/[0.06] p-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-zinc-600"><Clock size={10} /> Recent searches</span>
              <button type="button" onClick={() => setHistory([])} className="text-[10px] text-zinc-600 hover:text-zinc-300">Clear</button>
            </div>
            {history.slice(0, 5).map((entry) => (
              <button key={entry.id} type="button" onClick={() => setSearchQuery(entry.text)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200">
                <Clock size={10} className="text-zinc-700" />
                <span className="flex-1 truncate">{entry.text}</span>
                <span className="font-mono text-[9px] text-zinc-700">{entry.resultCount} · {formatRelativeTime(entry.at)}</span>
              </button>
            ))}
          </div>
        )}

        {query && suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
            <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">Suggestions</span>
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setSearchQuery(suggestion.replace(/^#/, ''))} className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-500 hover:border-cyan-400/30 hover:text-cyan-200">
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {results.length === 0 ? (
          <EmptyState title={query ? 'No matches' : 'Start typing to search'} description={query ? 'Try a different query, tag or fewer filters.' : 'Search includes titles, descriptions, tags, metadata and relationship labels.'} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {results.map((result, index) => {
              const info = NODE_TYPE_INFO[result.nodeType];
              return (
                <button
                  key={result.nodeId}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseResult(result)}
                  className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${index === activeIndex ? 'bg-cyan-400/[0.08]' : 'hover:bg-white/[0.03]'}`}
                >
                  <span className="mt-0.5 text-[13px] leading-none" style={{ color: info.color }}>{info.glyph}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-zinc-200"><Highlighted text={result.title} query={query} /></span>
                    <span className="mt-0.5 block truncate text-[10px] leading-relaxed text-zinc-600"><Highlighted text={result.snippet} query={query} /></span>
                    <span className="mt-1 flex items-center gap-2 text-[9px] text-zinc-700">
                      <span>{info.label}</span>
                      {result.matchedFields.slice(0, 3).map((field) => <span key={field}>#{field}</span>)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-zinc-700">
                    {index === activeIndex && <CornerDownLeft size={11} />}
                    <span className="font-mono text-[9px]">{Math.round(result.score)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-white/[0.06] px-3 py-2 text-[9px] text-zinc-700">
          <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> select &amp; focus</span>
          <span className="ml-auto">esc to close</span>
        </div>
      </div>
    </Panel>
  );
}

export default SearchPanel;
