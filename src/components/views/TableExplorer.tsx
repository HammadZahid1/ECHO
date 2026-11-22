import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Hash, Search } from 'lucide-react';
import type { GraphData, KnowledgeNode } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { useGraphStore } from '@/store/graphStore';
import { TextField } from '@/components/ui/controls';

type SortKey = 'title' | 'type' | 'degree' | 'importance' | 'createdAt' | 'updatedAt';

export function TableExplorer({ graph }: { graph: GraphData }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; descending: boolean }>({ key: 'degree', descending: true });
  const [type, setType] = useState('all');
  const selectedIds = useGraphStore((state) => state.selectedNodeIds);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);
  const degree = useMemo(() => {
    const adjacency = buildAdjacency(graph);
    return new Map(graph.nodes.map((node) => [node.id, adjacency.degree.get(node.id) ?? 0]));
  }, [graph]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = graph.nodes.filter((node) => {
      const matchesType = type === 'all' || node.type === type;
      const matchesQuery = !needle || node.title.toLowerCase().includes(needle) || node.description.toLowerCase().includes(needle) || node.tags.some((tag) => tag.toLowerCase().includes(needle));
      return matchesType && matchesQuery;
    });
    const value = (node: KnowledgeNode): string | number => {
      switch (sort.key) {
        case 'type': return node.type;
        case 'degree': return degree.get(node.id) ?? 0;
        case 'importance': return node.importance;
        case 'createdAt': return node.createdAt;
        case 'updatedAt': return node.updatedAt;
        default: return node.title.toLowerCase();
      }
    };
    return result.sort((a, b) => {
      const left = value(a);
      const right = value(b);
      const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
      return sort.descending ? -comparison : comparison;
    });
  }, [graph, query, type, sort, degree]);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'degree', label: 'Links' },
    { key: 'importance', label: 'Importance' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#08090b]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] p-3">
        <div className="relative w-full max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter knowledge…" aria-label="Filter table" className="pl-7" />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by node type" className="h-8 rounded border border-white/10 bg-[#101317] px-2 text-[11px] text-zinc-400 outline-none focus:border-cyan-400/50">
          <option value="all">All types</option>
          {Object.values(NODE_TYPE_INFO).map((info) => <option key={info.type} value={info.type}>{info.label}</option>)}
        </select>
        <span className="ml-auto font-mono text-[10px] text-zinc-600">{rows.length} / {graph.nodes.length} rows</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#0d1013] text-[9px] uppercase tracking-[0.14em] text-zinc-600">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="cursor-pointer border-b border-white/[0.07] px-3 py-2 font-medium" onClick={() => setSort((current) => ({ key: column.key, descending: current.key === column.key ? !current.descending : true }))}>
                  <span className="inline-flex items-center gap-1">{column.label}{sort.key === column.key && (sort.descending ? <ArrowDown size={9} /> : <ArrowUp size={9} />)}</span>
                </th>
              ))}
              <th className="border-b border-white/[0.07] px-3 py-2 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((node) => (
              <tr
                key={node.id}
                onClick={() => selectNode(node.id)}
                onDoubleClick={() => { selectNode(node.id); setFocus(node.id); }}
                className={`cursor-pointer border-b border-white/[0.04] ${selectedIds.includes(node.id) ? 'bg-cyan-400/[0.08] text-cyan-100' : 'text-zinc-400 hover:bg-white/[0.03]'}`}
              >
                <td className="max-w-[280px] truncate px-3 py-2 text-zinc-200">{node.title}</td>
                <td className="px-3 py-2"><span style={{ color: NODE_TYPE_INFO[node.type].color }}>{NODE_TYPE_INFO[node.type].label}</span></td>
                <td className="px-3 py-2 font-mono">{degree.get(node.id) ?? 0}</td>
                <td className="px-3 py-2"><span className="inline-block h-1.5 w-12 rounded bg-white/[0.06]"><span className="block h-full rounded bg-cyan-400/70" style={{ width: `${node.importance * 100}%` }} /></span></td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-600">{new Date(node.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-600">{new Date(node.updatedAt).toLocaleDateString()}</td>
                <td className="max-w-[220px] truncate px-3 py-2"><span className="inline-flex items-center gap-1">{node.tags.slice(0, 3).map((tag) => <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-zinc-500"><Hash size={8} />{tag}</span>)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-xs text-zinc-600">No knowledge matches the current filters.</p>}
      </div>
    </div>
  );
}
