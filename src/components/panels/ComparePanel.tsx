import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, GitCompare, Minus } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/controls';
import { Divider } from '@/components/ui/Divider';
import { EmptyState, StatTile } from '@/components/ui/states';
import { useActiveWorkspace } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { compareSnapshots, type GraphDiff } from '@/lib/graph/snapshot';

type StatKey = keyof GraphDiff['statisticsBefore'];

const STAT_LABELS: { key: StatKey; label: string; digits?: number }[] = [
  { key: 'nodeCount', label: 'Nodes' },
  { key: 'edgeCount', label: 'Relationships' },
  { key: 'averageDegree', label: 'Avg degree', digits: 2 },
  { key: 'clusterCount', label: 'Components' },
  { key: 'density', label: 'Density', digits: 3 },
];

export function ComparePanel() {
  const workspace = useActiveWorkspace();
  const compareSelection = useUIStore((state) => state.compareSelection);
  const setCompareSelection = useUIStore((state) => state.setCompareSelection);

  const [idA, idB] = compareSelection;
  const snapshotA = workspace.snapshots.find((snapshot) => snapshot.id === idA) ?? null;
  const snapshotB = workspace.snapshots.find((snapshot) => snapshot.id === idB) ?? null;

  const diff = useMemo(
    () => (snapshotA && snapshotB ? compareSnapshots(snapshotA, snapshotB) : null),
    [snapshotA, snapshotB],
  );

  const titleOf = (id: string): string =>
    (snapshotB?.graph.nodes.find((node) => node.id === id) ?? snapshotA?.graph.nodes.find((node) => node.id === id))?.title ?? id;

  const edgeLabel = (id: string): string => {
    const edge = snapshotB?.graph.edges.find((item) => item.id === id) ?? snapshotA?.graph.edges.find((item) => item.id === id);
    return edge ? `${titleOf(edge.source)} → ${titleOf(edge.target)}` : id;
  };

  return (
    <Panel title="Compare snapshots" subtitle="Structural delta between two saved states">
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Select label="Baseline (A)" value={idA ?? ''} onChange={(event) => setCompareSelection(0, event.target.value || null)}>
            <option value="">Select snapshot…</option>
            {workspace.snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>)}
          </Select>
          <Select label="Comparison (B)" value={idB ?? ''} onChange={(event) => setCompareSelection(1, event.target.value || null)}>
            <option value="">Select snapshot…</option>
            {workspace.snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.name}</option>)}
          </Select>
        </div>

        {!diff ? (
          <EmptyState
            icon={<GitCompare size={24} strokeWidth={1.2} />}
            title="Choose two snapshots"
            description="Pick a baseline and a comparison snapshot to see added, removed and modified nodes and relationships."
          />
        ) : (
          <>
            {idA === idB && (
              <p className="rounded border border-amber-500/25 bg-amber-500/[0.05] px-2.5 py-2 text-[10px] text-amber-300/80">
                Both selectors point to the same snapshot, so every delta is zero.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STAT_LABELS.map(({ key, label, digits }) => {
                const before = diff.statisticsBefore[key];
                const after = diff.statisticsAfter[key];
                const delta = after - before;
                return (
                  <StatTile
                    key={key}
                    label={label}
                    value={digits ? after.toFixed(digits) : after}
                    hint={`${delta >= 0 ? '+' : ''}${digits ? delta.toFixed(digits) : delta} from ${digits ? before.toFixed(digits) : before}`}
                    accent={delta > 0 ? '#58c9a0' : delta < 0 ? '#e46d70' : undefined}
                  />
                );
              })}
            </div>

            <Divider label="Changes" />
            <div className="space-y-3">
              <ChangeList title="Added nodes" tone="added" items={diff.addedNodes.map(titleOf)} />
              <ChangeList title="Removed nodes" tone="removed" items={diff.removedNodes.map(titleOf)} />
              <ChangeList title="Modified nodes" tone="modified" items={diff.modifiedNodes.map(titleOf)} />
              <ChangeList title="Added relationships" tone="added" items={diff.addedEdges.map(edgeLabel)} />
              <ChangeList title="Removed relationships" tone="removed" items={diff.removedEdges.map(edgeLabel)} />
              <ChangeList title="Modified relationships" tone="modified" items={diff.modifiedEdges.map(edgeLabel)} />
            </div>

            <p className="border-t border-white/[0.05] pt-2 text-[9px] leading-relaxed text-zinc-700">
              Comparison is structural and property-level: identity is matched by id, and edits are detected from titles, descriptions, types, tags, strengths and metadata.
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}

function ChangeList({ title, tone, items }: { title: string; tone: 'added' | 'removed' | 'modified'; items: string[] }) {
  const color = tone === 'added' ? 'text-emerald-300' : tone === 'removed' ? 'text-red-300' : 'text-amber-300';
  const Icon = tone === 'added' ? ArrowUpRight : tone === 'removed' ? ArrowDownRight : Minus;
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
      <p className={`flex items-center gap-1.5 text-[10px] font-medium ${color}`}><Icon size={11} />{title} <span className="font-mono text-zinc-600">{items.length}</span></p>
      {items.length === 0 ? (
        <p className="mt-1 pl-5 text-[10px] text-zinc-700">None</p>
      ) : (
        <ul className="mt-1 space-y-0.5 pl-5">
          {items.slice(0, 12).map((item, index) => <li key={`${item}-${index}`} className="truncate text-[10px] text-zinc-500">· {item}</li>)}
          {items.length > 12 && <li className="text-[10px] text-zinc-700">+{items.length - 12} more</li>}
        </ul>
      )}
    </div>
  );
}
