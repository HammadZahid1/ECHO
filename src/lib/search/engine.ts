import type { GraphData, SearchFilters, SearchHistoryEntry, SearchQuery, SearchResult } from '@/types';
import { buildIndex, type SearchDocument } from './indexer';
import { passesFilters, scoreDocument } from './score';
import { truncate } from '@/lib/utils/text';
import { createId } from '@/lib/utils/id';

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  types: [],
  tags: [],
  minImportance: 0,
};

export class SearchEngine {
  private documents = new Map<string, SearchDocument>();
  private history: SearchHistoryEntry[] = [];
  private historyLimit = 20;

  constructor(graph: GraphData) {
    this.setGraph(graph);
  }

  setGraph(graph: GraphData): void {
    this.documents = buildIndex(graph);
  }

  setHistoryLimit(limit: number): void {
    this.historyLimit = Math.max(1, limit);
  }

  search(query: SearchQuery): SearchResult[] {
    const normalized = query.text.trim();
    const results: SearchResult[] = [];
    for (const document of this.documents.values()) {
      if (!passesFilters(document, query.filters)) continue;
      if (!normalized) {
        results.push(this.toResult(document, 0, [], ['all']));
        continue;
      }
      const { score, matchedFields } = scoreDocument(document, normalized);
      if (score > 0) results.push(this.toResult(document, score, matchedFields, matchedFields));
    }
    results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return results.slice(0, query.limit);
  }

  quick(text: string, limit = 8): SearchResult[] {
    return this.search({ text, filters: DEFAULT_SEARCH_FILTERS, limit });
  }

  suggest(prefix: string, limit = 6): string[] {
    const normalized = prefix.trim().toLowerCase();
    if (!normalized) return [];
    const titles = [...this.documents.values()]
      .filter((document) => document.title.toLowerCase().includes(normalized))
      .sort((a, b) => a.title.toLowerCase().indexOf(normalized) - b.title.toLowerCase().indexOf(normalized))
      .slice(0, limit)
      .map((document) => document.title);
    const tags = [...new Set([...this.documents.values()].flatMap((document) => document.tags))]
      .filter((tag) => tag.includes(normalized))
      .slice(0, limit)
      .map((tag) => `#${tag}`);
    return [...new Set([...titles, ...tags])].slice(0, limit);
  }

  recordSearch(text: string, resultCount: number): void {
    if (!text.trim()) return;
    this.history = [
      { id: createId('search'), text: text.trim(), at: Date.now(), resultCount },
      ...this.history.filter((entry) => entry.text !== text.trim()),
    ].slice(0, this.historyLimit);
  }

  getHistory(): SearchHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private toResult(document: SearchDocument, score: number, highlightFields: string[], matchedFields: string[]): SearchResult {
    const snippet = document.description || document.tags.join(' · ') || 'No description yet';
    return {
      nodeId: document.nodeId,
      title: document.title,
      snippet: truncate(snippet, 110),
      score,
      highlights: highlightFields.map((field) => ({
        field: field as SearchResult['highlights'][number]['field'],
        value: field === 'description' ? snippet : document.title,
      })),
      matchedFields,
      nodeType: document.type as SearchResult['nodeType'],
    };
  }
}

export function createSearchEngine(graph: GraphData): SearchEngine {
  return new SearchEngine(graph);
}
