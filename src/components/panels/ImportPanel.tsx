import { useMemo, useRef, useState } from 'react';
import { CircleAlert, FileUp, Layers, Replace, Upload } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { TextArea, Toggle } from '@/components/ui/controls';
import { EmptyState, ErrorState, StatTile } from '@/components/ui/states';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { detectFormat, importContent } from '@/lib/importers';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { readFileAsText } from '@/lib/utils/download';
import type { ImportOptions, ImportResult } from '@/types';

const OPTION_LABELS: { key: keyof ImportOptions; label: string; hint?: string }[] = [
  { key: 'createMissingNodes', label: 'Create missing nodes', hint: 'Generate nodes for unknown endpoints' },
  { key: 'mergeById', label: 'Merge by id', hint: 'Reuse nodes with matching ids' },
  { key: 'generateMissingIds', label: 'Generate missing ids' },
  { key: 'preserveTimestamps', label: 'Preserve timestamps' },
  { key: 'importMetadata', label: 'Import metadata' },
  { key: 'nodeHierarchy', label: 'Parse hierarchy' },
  { key: 'relationParsing', label: 'Parse relationships' },
];

export function ImportPanel() {
  const importGraphIntoActive = useGraphStore((state) => state.importGraphIntoActive);
  const replaceActiveGraph = useGraphStore((state) => state.replaceActiveGraph);
  const pushToast = useUIStore((state) => state.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [options, setOptions] = useState<ImportOptions>({ ...DEFAULT_IMPORT_OPTIONS });
  const [readError, setReadError] = useState('');

  const format = useMemo(() => detectFormat(text, filename), [text, filename]);
  const parsed = useMemo<{ result: ImportResult | null; error: string }>(() => {
    if (!text.trim()) return { result: null, error: '' };
    try {
      return { result: importContent(text, filename, options), error: '' };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : 'Unable to parse the supplied content.' };
    }
  }, [text, filename, options]);

  const result = parsed.result;
  const blockingIssues = result?.issues.filter((issue) => issue.severity === 'error') ?? [];
  const canImport = Boolean(result && (result.importedNodes > 0 || result.importedEdges > 0));

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setReadError('');
    try {
      const content = await readFileAsText(file);
      setText(content);
      setFilename(file.name);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : `Unable to read ${file.name}`);
    }
  };

  const apply = (mode: 'merge' | 'replace'): void => {
    if (!result || !canImport) return;
    if (mode === 'replace') replaceActiveGraph(result.graph, `Import ${format}: ${filename || 'pasted text'}`);
    else importGraphIntoActive(result.graph, `Import ${format}: ${filename || 'pasted text'}`);
    pushToast({
      kind: 'success',
      title: mode === 'merge' ? 'Imported into universe' : 'Universe replaced',
      detail: `${result.importedNodes} nodes · ${result.importedEdges} relationships`,
    });
    setText('');
    setFilename('');
    setReadError('');
  };

  return (
    <Panel title="Import" subtitle="JSON · CSV · Markdown · plain text">
      <div className="space-y-4 p-3">
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.md,.markdown,.txt,text/plain,text/csv,application/json"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<FileUp size={12} />} onClick={() => fileRef.current?.click()}>Choose file</Button>
          <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-600">{filename || 'Or paste content below'}</span>
          {filename && <Button size="sm" variant="ghost" onClick={() => { setFilename(''); setText(''); if (fileRef.current) fileRef.current.value = ''; }}>Clear</Button>}
        </div>

        <TextArea
          label="Content"
          value={text}
          onChange={(event) => { setText(event.target.value); setFilename(''); }}
          placeholder={'{\n  "nodes": [...],\n  "edges": [...]\n}'}
          className="min-h-32 font-mono text-[11px]"
        />

        {readError && <ErrorState title="Could not read file" description={readError} />}
        {parsed.error && <ErrorState title="Parsing failed" description={parsed.error} />}

        {text.trim() && (
          <>
            <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
              <span className="text-[10px] text-zinc-500">Detected format</span>
              <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">{format}</span>
            </div>

            {blockingIssues.length > 0 && (
              <ErrorState
                title={`${blockingIssues.length} blocking issue${blockingIssues.length === 1 ? '' : 's'}`}
                description={blockingIssues.slice(0, 4).map((issue) => `${issue.message}${issue.path ? ` (${issue.path})` : ''}`).join(' · ')}
              />
            )}

            {result && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatTile label="Nodes" value={result.importedNodes} accent="#4fd8e8" />
                  <StatTile label="Relationships" value={result.importedEdges} accent="#9d7bf5" />
                  <StatTile label="Skipped nodes" value={result.skippedNodes} />
                  <StatTile label="Skipped edges" value={result.skippedEdges} />
                </div>

                <Divider label={`Import issues (${result.issues.length})`} />
                {result.issues.length === 0 ? (
                  <p className="text-[10px] text-zinc-600">No issues reported by the local parser.</p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-auto">
                    {result.issues.map((issue, index) => (
                      <div key={`${issue.code}-${index}`} className="flex gap-2 rounded border border-white/[0.05] bg-white/[0.02] px-2 py-1.5">
                        <CircleAlert size={11} className={`mt-0.5 shrink-0 ${issue.severity === 'error' ? 'text-red-300' : issue.severity === 'warning' ? 'text-amber-300' : 'text-cyan-300/70'}`} />
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-300">{issue.message}</p>
                          {issue.path && <p className="font-mono text-[9px] text-zinc-600">{issue.path}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!text.trim() && <EmptyState icon={<Upload size={24} strokeWidth={1.2} />} title="Nothing to import" description="Choose a file or paste JSON, CSV, Markdown or plain text to preview it before importing." />}

        <Divider label="Options" />
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {OPTION_LABELS.map(({ key, label, hint }) => (
            <Toggle key={key} label={label} hint={hint} checked={options[key]} onChange={(value) => setOptions((current) => ({ ...current, [key]: value }))} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
          <Button variant="primary" icon={<Layers size={12} />} disabled={!canImport} onClick={() => apply('merge')}>Merge into current</Button>
          <Button variant="secondary" icon={<Replace size={12} />} disabled={!canImport} onClick={() => apply('replace')}>Replace current</Button>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-700">Parsing and normalisation happen locally. Merge keeps existing knowledge and adds only new ids; replace swaps the active graph and can be undone.</p>
      </div>
    </Panel>
  );
}
