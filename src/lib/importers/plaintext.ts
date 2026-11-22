import type { ImportOptions, ImportResult, ParsedDocument } from '@/types';
import { DEFAULT_IMPORT_OPTIONS, normalizeGraph } from '@/lib/graph/validate';
import { createId } from '@/lib/graph/factory';
import { truncate } from '@/lib/utils/text';

/** Converts loosely structured plain text into nodes, tags and optional relations. */
export function parsePlainText(text: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ParsedDocument {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const nodes: ParsedDocument['nodes'] = [];
  const edges: ParsedDocument['edges'] = [];
  const relationPattern = /^(.+?)\s*(?:->|→|implies|causes)\s*(.+?)(?::\s*(.+))?$/i;

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const tags: string[] = [];
    const content: string[] = [];
    let title = '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('- ') || line.startsWith('#tag:')) {
        const tag = line.replace(/^(-|#tag:)\s*/i, '').trim();
        if (tag) tags.push(tag);
        continue;
      }
      if (!title && (line.length < 80 || line.endsWith(':'))) {
        title = line.replace(/:$/, '');
        continue;
      }
      content.push(line);
    }
    if (!title) title = truncate(content[0] ?? 'Untitled block', 60);
    nodes.push({
      id: createId('text'),
      title,
      description: content.join('\n').trim() || title,
      type: 'note',
      tags: [...new Set(tags.map((tag) => tag.replace(/^#/, '')))],
    });
  }

  if (options.relationParsing) {
    nodes.forEach((node, index) => {
      const match = relationPattern.exec(node.title ?? '');
      if (!match) return;
      const source = match[1].trim();
      const target = match[2].trim();
      const label = match[3]?.trim() || 'relates to';
      const sourceIndex = nodes.findIndex((candidate) => (candidate.title ?? '').toLowerCase() === source.toLowerCase());
      const targetIndex = nodes.findIndex((candidate) => (candidate.title ?? '').toLowerCase() === target.toLowerCase());
      if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== index) {
        edges.push({ sourceIndex, targetIndex, label, type: /cause/i.test(label) ? 'causes' : 'related' });
      }
    });
  }

  return {
    title: nodes[0]?.title ?? 'Imported text',
    nodes,
    edges,
    tags: [...new Set(nodes.flatMap((node) => node.tags ?? []))],
  };
}

export function importPlainText(text: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ImportResult {
  const parsed = parsePlainText(text, options);
  const ids = parsed.nodes.map((node) => node.id ?? createId('text'));
  const nodes = parsed.nodes.map((node, index) => ({ ...node, id: ids[index] }));
  const edges = parsed.edges.map((edge) => ({
    source: ids[edge.sourceIndex],
    target: ids[edge.targetIndex],
    label: edge.label,
    type: edge.type,
  })).filter((edge) => edge.source && edge.target);
  const normalized = normalizeGraph({ nodes, edges, tags: parsed.tags.map((name) => ({ name })) }, options);
  return {
    ok: normalized.graph.nodes.length > 0,
    format: 'text',
    graph: normalized.graph,
    issues: [],
    importedNodes: normalized.graph.nodes.length,
    importedEdges: normalized.graph.edges.length,
    skippedNodes: Math.max(0, nodes.length - normalized.graph.nodes.length),
    skippedEdges: Math.max(0, edges.length - normalized.graph.edges.length),
  };
}
