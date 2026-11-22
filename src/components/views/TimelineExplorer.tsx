import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { GraphData } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { useGraphStore } from '@/store/graphStore';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { TextField } from '@/components/ui/controls';

interface DayBucket {
  key: string;
  timestamp: number;
  nodes: GraphData['nodes'];
  edges: GraphData['edges'];
}

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function TimelineExplorer({ graph }: { graph: GraphData }) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);

  const buckets = useMemo(() => {
    const map = new Map<string, DayBucket>();
    const ensure = (timestamp: number): DayBucket => {
      const key = dayKey(timestamp);
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { key, timestamp, nodes: [], edges: [] };
        map.set(key, bucket);
      }
      return bucket;
    };
    for (const node of graph.nodes) ensure(node.createdAt).nodes.push(node);
    for (const edge of graph.edges) ensure(edge.createdAt).edges.push(edge);
    return [...map.values()].sort((a, b) => a.timestamp - b.timestamp);
  }, [graph]);

  useEffect(() => { setIndex(buckets.length - 1); }, [buckets.length]);

  useEffect(() => {
    if (!playing || buckets.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= buckets.length - 1) { setPlaying(false); return current; }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, buckets.length]);

  const visibleBuckets = buckets.filter((bucket) => (!from || bucket.key >= from) && (!to || bucket.key <= to));
  const current = buckets[index];
  const visibleIds = new Set(visibleBuckets.filter((bucket) => !current || bucket.timestamp <= current.timestamp).flatMap((bucket) => bucket.nodes.map((node) => node.id)));
  const visibleNodes = graph.nodes.filter((node) => visibleIds.has(node.id));
  const visibleEdges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const maxCount = Math.max(1, ...visibleBuckets.map((bucket) => bucket.nodes.length + bucket.edges.length));

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#08090b]">
      <header className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] p-3">
        <CalendarDays size={14} className="text-cyan-300" />
        <h1 className="text-xs uppercase tracking-[0.16em] text-zinc-400">Knowledge timeline</h1>
        <span className="font-mono text-[10px] text-zinc-600">{visibleNodes.length} nodes · {visibleEdges.length} links</span>
        <div className="ml-auto flex items-center gap-1.5">
          <TextField type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Timeline start date" className="h-7 w-32 text-[10px]" />
          <span className="text-[10px] text-zinc-700">to</span>
          <TextField type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Timeline end date" className="h-7 w-32 text-[10px]" />
          <IconButton label="Previous day" onClick={() => setIndex((value) => Math.max(0, value - 1))}><SkipBack size={13} /></IconButton>
          <IconButton label={playing ? 'Pause timeline' : 'Play timeline'} active={playing} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={13} /> : <Play size={13} />}</IconButton>
          <IconButton label="Next day" onClick={() => setIndex((value) => Math.min(buckets.length - 1, value + 1))}><SkipForward size={13} /></IconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {current && (
          <div className="mb-4 border border-cyan-400/20 bg-cyan-400/[0.04] p-3 text-[11px] text-zinc-400">
            Showing history through <span className="font-mono text-cyan-200">{current.key}</span> · {visibleBuckets.filter((bucket) => bucket.timestamp <= current.timestamp).length} of {buckets.length} days
          </div>
        )}
        <div className="space-y-1">
          {visibleBuckets.map((bucket) => {
            const active = current?.key === bucket.key;
            const count = bucket.nodes.length + bucket.edges.length;
            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => { setIndex(buckets.findIndex((item) => item.key === bucket.key)); }}
                className={`flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors ${active ? 'border-cyan-400/30 bg-cyan-400/[0.06]' : 'border-white/[0.05] hover:border-white/15'}`}
              >
                <span className="w-24 font-mono text-[10px] text-zinc-500">{bucket.key}</span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-white/[0.04]">
                  <span className="block h-full rounded bg-gradient-to-r from-cyan-500/70 to-violet-500/70" style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span className="w-16 text-right font-mono text-[10px] text-zinc-600">{count} items</span>
                <span className="hidden w-20 text-right font-mono text-[10px] text-zinc-700 md:block">{bucket.nodes.length}n {bucket.edges.length}e</span>
              </button>
            );
          })}
        </div>

        {current && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <section className="border border-white/[0.07] p-3">
              <h2 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Nodes created on {current.key}</h2>
              <ul className="max-h-56 space-y-1 overflow-auto">
                {current.nodes.map((node) => (
                  <li key={node.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => { selectNode(node.id); setFocus(node.id); }} className="flex-1 truncate text-left text-[11px] text-zinc-400 hover:text-cyan-200">{node.title}</button>
                    <span className="text-[9px]" style={{ color: NODE_TYPE_INFO[node.type].color }}>{NODE_TYPE_INFO[node.type].label}</span>
                  </li>
                ))}
                {current.nodes.length === 0 && <li className="text-[11px] text-zinc-700">No nodes created.</li>}
              </ul>
            </section>
            <section className="border border-white/[0.07] p-3">
              <h2 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Relationships created</h2>
              <ul className="max-h-56 space-y-1 overflow-auto">
                {current.edges.map((edge) => (
                  <li key={edge.id} className="truncate text-[11px] text-zinc-500">
                    {graph.nodes.find((node) => node.id === edge.source)?.title ?? edge.source} → {graph.nodes.find((node) => node.id === edge.target)?.title ?? edge.target}
                    <span className="ml-2 text-[9px] text-zinc-700">{edge.type}</span>
                  </li>
                ))}
                {current.edges.length === 0 && <li className="text-[11px] text-zinc-700">No relationships created.</li>}
              </ul>
            </section>
          </div>
        )}
        {visibleBuckets.length === 0 && <p className="p-8 text-center text-xs text-zinc-600">No activity in this date range.</p>}
      </div>
    </div>
  );
}
