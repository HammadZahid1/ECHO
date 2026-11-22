import { useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, Info, RotateCcw, Wrench } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/states';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useGraphHealth } from '@/hooks/useGraphDerived';
import type { HealthFix, HealthIssue } from '@/types';

type SeverityFilter = 'all' | HealthIssue['severity'];

const SEVERITY_STYLE: Record<HealthIssue['severity'], { text: string; border: string; bg: string; icon: typeof Info }> = {
  critical: { text: 'text-red-300', border: 'border-red-500/30', bg: 'bg-red-500/[0.06]', icon: CircleAlert },
  warning: { text: 'text-amber-300', border: 'border-amber-500/25', bg: 'bg-amber-500/[0.05]', icon: CircleAlert },
  info: { text: 'text-cyan-300/80', border: 'border-cyan-400/20', bg: 'bg-cyan-400/[0.04]', icon: Info },
};

export function HealthPanel() {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const report = useGraphHealth(graph);
  const [severity, setSeverity] = useState<SeverityFilter>('all');

  const createEdge = useGraphStore((state) => state.createEdge);
  const assignTag = useGraphStore((state) => state.assignTag);
  const deleteEdge = useGraphStore((state) => state.deleteEdge);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocus = useGraphStore((state) => state.setFocus);
  const commitGraph = useGraphStore((state) => state.commitGraph);
  const pushToast = useUIStore((state) => state.pushToast);

  const counts = useMemo(() => ({
    all: report.issues.length,
    critical: report.issues.filter((issue) => issue.severity === 'critical').length,
    warning: report.issues.filter((issue) => issue.severity === 'warning').length,
    info: report.issues.filter((issue) => issue.severity === 'info').length,
  }), [report.issues]);

  const visible = useMemo(
    () => (severity === 'all' ? report.issues : report.issues.filter((issue) => issue.severity === severity)),
    [report.issues, severity],
  );

  const nodeTitle = (id: string): string => graph.nodes.find((node) => node.id === id)?.title ?? 'Unknown node';

  const mergeNodes = (keepId: string, removeId: string): void => {
    const keep = graph.nodes.find((node) => node.id === keepId);
    const remove = graph.nodes.find((node) => node.id === removeId);
    if (!keep || !remove) return;
    const merged = {
      ...keep,
      tags: [...new Set([...keep.tags, ...remove.tags])],
      references: [...new Set([...keep.references, ...remove.references])],
      description: keep.description.trim() ? keep.description : remove.description,
      importance: Math.max(keep.importance, remove.importance),
      updatedAt: Date.now(),
    };
    const nodes = graph.nodes
      .filter((node) => node.id !== removeId)
      .map((node) => (node.id === keepId ? merged : node));
    const edges = graph.edges
      .filter((edge) => !(
        (edge.source === keepId && edge.target === removeId) ||
        (edge.source === removeId && edge.target === keepId)
      ))
      .map((edge) => ({
        ...edge,
        source: edge.source === removeId ? keepId : edge.source,
        target: edge.target === removeId ? keepId : edge.target,
      }));
    commitGraph({ ...graph, nodes, edges }, 'node.remove', `Merge ${remove.title} into ${keep.title}`, [keepId, removeId]);
    pushToast({ kind: 'success', title: 'Nodes merged', detail: `${remove.title} was merged into ${keep.title}.` });
  };

  const applyFix = (fix: HealthFix): void => {
    switch (fix.kind) {
      case 'add-tag':
        assignTag(fix.nodeId, fix.tag);
        pushToast({ kind: 'success', title: `Tagged as ${fix.tag}` });
        break;
      case 'describe':
        selectNode(fix.nodeId);
        setFocus(fix.nodeId);
        pushToast({ kind: 'info', title: 'Node selected', detail: 'Add a description in the inspector.' });
        break;
      case 'connect':
        if (createEdge(fix.source, fix.target, { type: fix.type })) {
          pushToast({ kind: 'success', title: 'Relationship created' });
        }
        break;
      case 'merge':
        mergeNodes(fix.keepId, fix.removeId);
        break;
      case 'delete-edge':
        deleteEdge(fix.edgeId);
        pushToast({ kind: 'success', title: 'Broken relationship removed' });
        break;
    }
  };

  const scoreColor = report.score >= 85 ? '#58c9a0' : report.score >= 60 ? '#e3b35c' : '#e46d70';

  return (
    <Panel title="Graph health" subtitle="Local heuristics · no external analysis">
      <div className="space-y-4 p-3">
        <div className="rounded border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">Health score</p>
              <p className="mt-1 font-mono text-3xl leading-none" style={{ color: scoreColor }}>{report.score}</p>
            </div>
            <div className="text-right text-[10px] text-zinc-600">
              <p>{report.nodeCount} nodes · {report.edgeCount} relationships</p>
              <p>{report.issues.length} findings</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${report.score}%`, background: scoreColor }} />
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-zinc-700">
            Scores come from transparent local heuristics on the current graph. They are guidance, not a guarantee of correctness.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <SegmentedControl
            value={severity}
            onChange={setSeverity}
            options={[
              { value: 'all', label: `All ${counts.all}` },
              { value: 'critical', label: `Critical ${counts.critical}` },
              { value: 'warning', label: `Warning ${counts.warning}` },
              { value: 'info', label: `Info ${counts.info}` },
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<CircleCheck size={24} strokeWidth={1.2} />}
            title={counts.all === 0 ? 'No issues found' : 'No issues at this severity'}
            description={counts.all === 0 ? 'Local checks found nothing to flag in this graph.' : 'Try a different severity filter.'}
          />
        ) : (
          <div className="space-y-2">
            {visible.map((issue) => {
              const style = SEVERITY_STYLE[issue.severity];
              const SeverityIcon = style.icon;
              return (
                <div key={issue.id} className={`rounded border ${style.border} ${style.bg} p-2.5`}>
                  <div className="flex items-start gap-2">
                    <SeverityIcon size={13} className={`mt-0.5 shrink-0 ${style.text}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-medium ${style.text}`}>{issue.title}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{issue.detail}</p>
                      {issue.suggestion && <p className="mt-1 text-[10px] italic text-zinc-600">{issue.suggestion}</p>}
                      {issue.nodeIds.length > 0 && (
                        <p className="mt-1 truncate text-[9px] text-zinc-700">Nodes: {issue.nodeIds.slice(0, 4).map(nodeTitle).join(', ')}{issue.nodeIds.length > 4 ? '…' : ''}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {issue.fix &&
                          <Button size="sm" variant="primary" icon={<Wrench size={11} />} onClick={() => applyFix(issue.fix!)}>
                            {fixLabel(issue.fix)}
                          </Button>}
                        {issue.nodeIds[0] &&
                          <Button size="sm" variant="ghost" icon={<RotateCcw size={11} />} onClick={() => { selectNode(issue.nodeIds[0]); setFocus(issue.nodeIds[0]); }}>
                            Inspect
                          </Button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}

function fixLabel(fix: HealthFix): string {
  switch (fix.kind) {
    case 'add-tag': return `Add “${fix.tag}” tag`;
    case 'describe': return 'Describe';
    case 'connect': return 'Connect';
    case 'merge': return 'Merge';
    case 'delete-edge': return 'Delete edge';
  }
}
