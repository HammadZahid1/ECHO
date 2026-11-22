import type { ImportOptions, ImportResult } from '@/types';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { importJson } from './json';
import { importCsvEdges, importCsvNodes } from './csv';
import { importMarkdown } from './markdown';
import { importPlainText } from './plaintext';

export * from './json';
export * from './csv';
export * from './markdown';
export * from './plaintext';

export function detectFormat(text: string, filename = ''): ImportResult['format'] {
  const name = filename.toLowerCase();
  if (name.endsWith('.csv')) {
    const header = text.split(/\r?\n/, 1)[0]?.toLowerCase() ?? '';
    return header.includes('source') && header.includes('target') ? 'csv-edges' : 'csv-nodes';
  }
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
  if (name.endsWith('.json')) return 'json';
  const trimmed = text.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (/^#{1,6}\s+/m.test(text)) return 'markdown';
  if (/^\s*(?:id|title|source),/im.test(text)) return 'csv-nodes';
  return 'text';
}

export function importContent(
  text: string,
  filename = '',
  options: ImportOptions = DEFAULT_IMPORT_OPTIONS,
  nodesCsv?: string,
): ImportResult {
  switch (detectFormat(text, filename)) {
    case 'json': return importJson(text, options);
    case 'csv-nodes': return importCsvNodes(text, options);
    case 'csv-edges': return importCsvEdges(text, nodesCsv, options);
    case 'markdown': return importMarkdown(text, options);
    case 'text': return importPlainText(text, options);
    default: return importPlainText(text, options);
  }
}
