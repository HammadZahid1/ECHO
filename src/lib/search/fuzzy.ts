import type { CommandAction, SearchResult } from '@/types';
import { normalizeText } from '@/lib/utils/text';

/** Lightweight subsequence-based fuzzy match with contiguous and prefix bonuses. */
export function fuzzyScore(query: string, target: string): number {
  const q = normalizeText(query);
  const t = normalizeText(target);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  let queryIndex = 0;
  let streak = 0;
  let score = 0;
  for (let i = 0; i < t.length && queryIndex < q.length; i += 1) {
    if (t[i] === q[queryIndex]) {
      streak += 1;
      score += 4 + streak * 2 + (i === 0 ? 3 : 0);
      queryIndex += 1;
    } else {
      streak = 0;
    }
  }
  return queryIndex === q.length ? score : 0;
}

export function filterCommands(commands: CommandAction[], query: string, limit = 12): CommandAction[] {
  if (!query.trim()) return commands.filter((command) => !command.disabled).slice(0, limit);
  return commands
    .filter((command) => !command.disabled)
    .map((command) => {
      const best = Math.max(
        fuzzyScore(query, command.title),
        ...command.keywords.map((keyword) => fuzzyScore(query, keyword) * 0.8),
        command.shortcut ? fuzzyScore(query, command.shortcut) * 0.6 : 0,
      );
      return { command, score: best };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.command);
}

export function rankSearchResults(results: SearchResult[], query: string): SearchResult[] {
  if (!query.trim()) return results;
  return results
    .map((result) => ({ result, score: result.score + fuzzyScore(query, result.title) * 0.4 }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.result);
}
