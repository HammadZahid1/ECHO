import type { SearchDocument } from './indexer';
import type { SearchFilters } from '@/types';
import { normalizeText, tokenize } from '@/lib/utils/text';

export interface ScoreResult {
  score: number;
  matchedFields: string[];
}

const FIELD_WEIGHTS = {
  title: 12,
  tag: 7,
  type: 3,
  description: 3,
  relationship: 2.5,
  metadata: 1.5,
} as const;

/** Transparent weighted scoring across indexed fields. */
export function scoreDocument(document: SearchDocument, query: string): ScoreResult {
  const normalized = normalizeText(query);
  if (!normalized) return { score: 0, matchedFields: [] };
  const terms = tokenize(normalized);
  if (terms.length === 0) terms.push(normalized);
  let score = 0;
  const matchedFields = new Set<string>();

  if (document.normalizedTitle === normalized) {
    score += FIELD_WEIGHTS.title * 3;
    matchedFields.add('title');
  }
  if (document.normalizedTitle.startsWith(normalized)) {
    score += FIELD_WEIGHTS.title * 1.5;
    matchedFields.add('title');
  }

  for (const term of terms) {
    if (document.normalizedTitle.includes(term)) {
      score += FIELD_WEIGHTS.title;
      matchedFields.add('title');
    }
    for (const tag of document.tags) {
      if (tag.includes(term)) {
        score += FIELD_WEIGHTS.tag;
        matchedFields.add('tags');
        break;
      }
    }
    if (document.type.includes(term)) {
      score += FIELD_WEIGHTS.type;
      matchedFields.add('type');
    }
    if (document.description.includes(term)) {
      score += FIELD_WEIGHTS.description;
      matchedFields.add('description');
    }
    if (document.relationshipText.includes(term)) {
      score += FIELD_WEIGHTS.relationship;
      matchedFields.add('relationships');
    }
    if (document.metadataText.includes(term)) {
      score += FIELD_WEIGHTS.metadata;
      matchedFields.add('metadata');
    }
    if (!document.searchText.includes(term) && document.tokens.size > 0) {
      for (const token of document.tokens) {
        if (token.startsWith(term) && term.length > 2) {
          score += 1;
          matchedFields.add('title');
          break;
        }
      }
    }
  }

  score += document.importance * 2;
  score += Math.min(1, document.updatedAt / Date.now()) * 0.5;
  return { score, matchedFields: [...matchedFields] };
}

export function passesFilters(document: SearchDocument, filters: SearchFilters): boolean {
  if (filters.types.length > 0 && !filters.types.includes(document.type as SearchFilters['types'][number])) return false;
  if (filters.tags.length > 0 && !filters.tags.some((tag) => document.tags.includes(normalizeText(tag)))) return false;
  if (document.importance < filters.minImportance) return false;
  if (filters.createdAfter !== undefined && document.createdAt < filters.createdAfter) return false;
  if (filters.modifiedAfter !== undefined && document.updatedAt < filters.modifiedAfter) return false;
  if (filters.onlyConnected && document.relationshipText.trim() === '') return false;
  return true;
}
