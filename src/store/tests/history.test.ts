import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  historyState,
  pushHistory,
  redoEntry,
  trimHistory,
  undoEntry,
} from '@/store/history';
import { createHistory, createNode } from '@/lib/graph/factory';
import type { GraphData, GraphHistory } from '@/types';

function baseGraph(): GraphData {
  return {
    nodes: [createNode({ id: 'a', title: 'Alpha' })],
    edges: [],
    tags: [],
  };
}

function graphWith(title: string): GraphData {
  const graph = baseGraph();
  graph.nodes.push(createNode({ id: title, title }));
  return graph;
}

describe('history helpers', () => {
  it('createHistory starts empty with a configurable limit', () => {
    expect(createHistory()).toEqual({ entries: [], cursor: -1, limit: 120 });
    expect(createHistory(5)).toEqual({ entries: [], cursor: -1, limit: 5 });
    expect(createHistory(0).limit).toBe(0);
  });

  it('pushHistory records cloned snapshots, metadata and affected ids', () => {
    const before = baseGraph();
    const after = graphWith('Beta');
    const history = pushHistory(createHistory(), 'node.add', 'Add Beta', before, after, ['Beta'], ['e1']);

    expect(history.cursor).toBe(0);
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0]).toMatchObject({
      kind: 'node.add',
      label: 'Add Beta',
      affectedNodeIds: ['Beta'],
      affectedEdgeIds: ['e1'],
    });
    expect(history.entries[0].before).toEqual(before);
    expect(history.entries[0].after).toEqual(after);

    after.nodes[0].title = 'Mutated';
    expect(history.entries[0].after.nodes.map((node) => node.title)).toEqual(['Alpha', 'Beta']);
  });

  it('pushHistory is a no-op when the graph reference is unchanged', () => {
    const history = createHistory();
    const graph = baseGraph();

    expect(pushHistory(history, 'node.update', 'No change', graph, graph)).toBe(history);
    expect(history.entries).toHaveLength(0);
  });

  it('canUndo, canRedo, undoEntry and redoEntry move the cursor within bounds', () => {
    const before = baseGraph();
    let history = pushHistory(createHistory(), 'node.add', 'First', before, graphWith('First'));
    history = pushHistory(history, 'node.add', 'Second', graphWith('First'), graphWith('Second'));

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);

    history = undoEntry(history);
    expect(history.cursor).toBe(0);
    expect(canRedo(history)).toBe(true);
    expect(historyState(history)?.nodes.map((node) => node.title)).toEqual(['Alpha', 'First']);

    history = redoEntry(history);
    expect(history.cursor).toBe(1);
    expect(canRedo(history)).toBe(false);
    const exhausted = undoEntry(undoEntry(history));
    expect(exhausted.cursor).toBe(-1);
    expect(undoEntry(exhausted)).toBe(exhausted);
  });

  it('pushing after an undo discards the redo branch', () => {
    const start = baseGraph();
    let history = pushHistory(createHistory(), 'node.add', 'First', start, graphWith('First'));
    history = pushHistory(history, 'node.add', 'Second', graphWith('First'), graphWith('Second'));
    history = undoEntry(history);
    history = pushHistory(history, 'node.add', 'Alternative', graphWith('First'), graphWith('Alternative'));

    expect(history.entries.map((entry) => entry.label)).toEqual(['First', 'Alternative']);
    expect(history.cursor).toBe(1);
    expect(canRedo(history)).toBe(false);
  });

  it('historyState returns a detached copy of the current graph', () => {
    const after = graphWith('Beta');
    const history = pushHistory(createHistory(), 'node.add', 'Add', baseGraph(), after);
    const snapshot = historyState(history)!;

    expect(snapshot).toEqual(after);
    snapshot.nodes[0].title = 'Detached';
    expect(history.entries[0].after.nodes[0].title).toBe('Alpha');
    expect(historyState(createHistory())).toBeNull();
  });

  it('trimHistory drops the oldest entries and clamps the cursor', () => {
    const start = baseGraph();
    let history: GraphHistory = createHistory(5);
    for (let index = 0; index < 4; index += 1) {
      history = pushHistory(history, 'node.update', `Step ${index}`, start, graphWith(`Step ${index}`));
    }
    expect(history.entries).toHaveLength(4);

    const trimmed = trimHistory(history, 2);
    expect(trimmed.entries.map((entry) => entry.label)).toEqual(['Step 2', 'Step 3']);
    expect(trimmed.cursor).toBe(1);
    expect(trimmed.limit).toBe(2);

    const unchanged = trimHistory(trimmed, 2);
    expect(unchanged.entries).toBe(trimmed.entries);
  });

  it('undo and redo at the boundaries do not change the history', () => {
    const empty = createHistory();
    expect(undoEntry(empty)).toBe(empty);
    expect(redoEntry(empty)).toBe(empty);
    expect(canUndo(empty)).toBe(false);
    expect(canRedo(empty)).toBe(false);

    const single = pushHistory(empty, 'node.add', 'Only', baseGraph(), graphWith('Only'));
    expect(undoEntry(single).cursor).toBe(-1);
    expect(redoEntry(undoEntry(single)).cursor).toBe(0);
  });
});
