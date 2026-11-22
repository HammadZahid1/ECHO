import type { ImportIssue, ImportOptions, ImportResult, ParsedDocument } from '@/types';
import { DEFAULT_IMPORT_OPTIONS, normalizeGraph } from '@/lib/graph/validate';
import { createGraphData, createId } from '@/lib/graph/factory';
import { normalizeText } from '@/lib/utils/text';

export function parseMarkdown(text: string): ParsedDocument {
  const lines = text.split(/\r?\n/);
  const nodes: ParsedDocument['nodes'] = [];
  const edges: ParsedDocument['edges'] = [];
  const headingStack: { level: number; index: number }[] = [];
  const tags = new Set<string>();
  let title = 'Imported document';
  let current: { title: string; lines: string[]; level: number; tags: string[]; links: string[] } | null = null;

  const flush = (): void => {
    if (!current) return;
    nodes.push({
      id: createId('md'),
      title: current.title,
      description: current.lines.join('\n').trim(),
      type: current.level === 1 ? 'note' : 'concept',
      tags: current.tags,
      references: current.links,
    });
    current = null;
  };

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      const headingTitle = heading[2].replace(/[*_`]/g, '').trim();
      if (level === 1 && title === 'Imported document') title = headingTitle;
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) headingStack.pop();
      const index = nodes.length;
      current = { title: headingTitle, lines: [], level, tags: [], links: [] };
      headingStack.push({ level, index });
      continue;
    }

    if (!current) {
      if (line.trim() !== '') current = { title, lines: [], level: 1, tags: [], links: [] };
      else continue;
    }

    const tagMatches = line.matchAll(/(?:\[\[([^\]]+)\]\]|(?<![\w/])#([a-zA-Z][\w-]{1,24}))/g);
    for (const match of tagMatches) {
      const tag = (match[1] ?? match[2] ?? '').trim();
      if (tag) {
        tags.add(normalizeText(tag));
        current.tags.push(normalizeText(tag));
      }
    }
    const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
      const target = match[2];
      if (target) current.links.push(target);
    }
    current.lines.push(line);
  }
  flush();

  // Nested headings become contains relationships; internal wiki links connect matching nodes.
  const stack: number[] = [];
  nodes.forEach((node, index) => {
    while (stack.length > 0 && (nodes[stack[stack.length - 1]]?.level ?? 0) >= (node.level ?? 0)) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent !== undefined) edges.push({ sourceIndex: parent, targetIndex: index, label: 'contains', type: 'contains' });
    stack.push(index);
  });
  nodes.forEach((node, index) => {
    for (const link of node.references ?? []) {
      const targetTitle = normalizeText(link.replace(/^#/, '').replace(/\.md$/i, ''));
      const targetIndex = nodes.findIndex((candidate) => normalizeText(candidate.title ?? '') === targetTitle);
      if (targetIndex >= 0 && targetIndex !== index) {
        edges.push({ sourceIndex: index, targetIndex, label: 'references', type: 'references' });
      }
    }
  });

  return { title, nodes, edges, tags: [...tags] };
}

export function importMarkdown(text: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ImportResult {
  const parsed = parseMarkdown(text);
  const issues: ImportIssue[] = [];
  if (parsed.nodes.length === 0) issues.push({ severity: 'warning', code: 'markdown.empty', message: 'No headings or paragraphs found in document' });
  const idMap = parsed.nodes.map((node) => node.id ?? createId('md'));
  const nodes = parsed.nodes.map((node, index) => ({
    ...node,
    id: idMap[index],
    type: node.type ?? 'note',
    tags: node.tags ?? [],
    references: node.references ?? [],
  }));
  const edges = options.nodeHierarchy || options.relationParsing
    ? parsed.edges.map((edge) => ({
      source: idMap[edge.sourceIndex],
      target: idMap[edge.targetIndex],
      type: edge.type,
      label: edge.label,
    })).filter((edge) => edge.source && edge.target)
    : [];
  const normalized = normalizeGraph({ nodes, edges, tags: parsed.tags.map((name) => ({ name })) }, options);
  return {
    ok: normalized.graph.nodes.length > 0,
    format: 'markdown',
    graph: normalized.graph,
    issues: [...issues, ...normalized.issues],
    importedNodes: normalized.graph.nodes.length,
    importedEdges: normalized.graph.edges.length,
    skippedNodes: Math.max(0, nodes.length - normalized.graph.nodes.length),
    skippedEdges: Math.max(0, edges.length - normalized.graph.edges.length),
  };
}
