import type { NodeType } from './graph';

export interface SearchFilters {
  types: NodeType[];
  tags: string[];
  minImportance: number;
  createdAfter?: number;
  modifiedAfter?: number;
  onlyConnected?: boolean;
}

export interface SearchHighlight {
  field: 'title' | 'description' | 'tags' | 'metadata' | 'relationships' | 'type';
  value: string;
}

export interface SearchResult {
  nodeId: string;
  title: string;
  snippet: string;
  score: number;
  highlights: SearchHighlight[];
  matchedFields: string[];
  nodeType: NodeType;
}

export interface SearchQuery {
  text: string;
  filters: SearchFilters;
  limit: number;
}

export interface SearchHistoryEntry {
  id: string;
  text: string;
  at: number;
  resultCount: number;
}

export interface CommandAction {
  id: string;
  title: string;
  group: string;
  keywords: string[];
  shortcut?: string;
  icon?: string;
  disabled?: boolean;
  run: () => void;
}
