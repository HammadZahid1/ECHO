const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'into',
  'about', 'through', 'over', 'under', 'between', 'its', 'their', 'our', 'your', 'has',
  'have', 'had', 'not', 'but', 'can', 'may', 'use', 'using', 'than', 'then', 'also',
]);

export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function uniqueTokens(value: string): string[] {
  return [...new Set(tokenize(value))];
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

export function truncate(value: string, length = 140): string {
  return value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;
}

export function wordCount(value: string): number {
  return value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
}

/** Dice coefficient over character bigrams; useful for local duplicate detection. */
export function bigramSimilarity(a: string, b: string): number {
  const left = normalizeText(a).replace(/\s+/g, '');
  const right = normalizeText(b).replace(/\s+/g, '');
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;
  const grams = (text: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < text.length - 1; i += 1) {
      const gram = text.slice(i, i + 2);
      map.set(gram, (map.get(gram) ?? 0) + 1);
    }
    return map;
  };
  const aGrams = grams(left);
  const bGrams = grams(right);
  let overlap = 0;
  for (const [gram, count] of aGrams) overlap += Math.min(count, bGrams.get(gram) ?? 0);
  return (2 * overlap) / (left.length - 1 + right.length - 1);
}

/** Jaccard overlap of token sets. */
export function tokenSimilarity(a: string, b: string): number {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (aSet.size === 0 && bSet.size === 0) return 0;
  let intersection = 0;
  for (const token of aSet) if (bSet.has(token)) intersection += 1;
  return intersection / (aSet.size + bSet.size - intersection);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface TextMatch {
  start: number;
  end: number;
}

export function findMatches(text: string, query: string): TextMatch[] {
  if (!query.trim()) return [];
  const matches: TextMatch[] = [];
  const needle = normalizeText(query);
  const haystack = normalizeText(text);
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    matches.push({ start: index, end: index + needle.length });
    index = haystack.indexOf(needle, index + needle.length);
  }
  return matches;
}
