import type { GraphData, GraphHistory, GraphHistoryEntry, HistoryActionKind } from '@/types';
import { cloneGraph } from '@/lib/graph/factory';
import { createId } from '@/lib/utils/id';

export function pushHistory(
  history: GraphHistory,
  kind: HistoryActionKind,
  label: string,
  before: GraphData,
  after: GraphData,
  affectedNodeIds: string[] = [],
  affectedEdgeIds: string[] = [],
): GraphHistory {
  if (before === after) return history;
  const entry: GraphHistoryEntry = {
    id: createId('history'),
    kind,
    label,
    at: Date.now(),
    before: cloneGraph(before),
    after: cloneGraph(after),
    affectedNodeIds,
    affectedEdgeIds,
  };
  const entries = [...history.entries.slice(0, history.cursor + 1), entry].slice(-history.limit);
  return { ...history, entries, cursor: entries.length - 1 };
}

export function canUndo(history: GraphHistory): boolean {
  return history.cursor >= 0;
}

export function canRedo(history: GraphHistory): boolean {
  return history.cursor < history.entries.length - 1;
}

export function undoEntry(history: GraphHistory): GraphHistory {
  return canUndo(history) ? { ...history, cursor: history.cursor - 1 } : history;
}

export function redoEntry(history: GraphHistory): GraphHistory {
  return canRedo(history) ? { ...history, cursor: history.cursor + 1 } : history;
}

export function historyState(history: GraphHistory): GraphData | null {
  const entry = history.entries[history.cursor];
  return entry ? cloneGraph(entry.after) : null;
}

export function trimHistory(history: GraphHistory, limit: number): GraphHistory {
  if (history.entries.length <= limit) return { ...history, limit };
  const entries = history.entries.slice(-limit);
  return { ...history, entries, cursor: Math.min(history.cursor, entries.length - 1), limit };
}
