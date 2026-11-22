import type { GraphData } from '@/types';
import { bigramSimilarity, tokenSimilarity, uniqueTokens } from '@/lib/utils/text';

export interface SimilarityPair {
  a: string;
  b: string;
  score: number;
  reason: string;
}

/** Local text similarity only — no external or semantic AI service. */
export function combinedSimilarity(aTitle: string, aDescription: string, aTags: string[], bTitle: string, bDescription: string, bTags: string[]): number {
  const titleScore = bigramSimilarity(aTitle, bTitle);
  const descriptionScore = tokenSimilarity(`${aTitle} ${aDescription}`, `${bTitle} ${bDescription}`);
  const aTagsSet = new Set(aTags);
  const bTagsSet = new Set(bTags);
  let sharedTags = 0;
  for (const tag of aTagsSet) if (bTagsSet.has(tag)) sharedTags += 1;
  const tagScore = sharedTags / Math.max(1, new Set([...aTagsSet, ...bTagsSet]).size);
  return titleScore * 0.45 + descriptionScore * 0.35 + tagScore * 0.2;
}

/** Finds potentially duplicate concepts using transparent local heuristics. */
export function findSimilarNodes(graph: GraphData, threshold = 0.62, limit = 40): SimilarityPair[] {
  const pairs: SimilarityPair[] = [];
  for (let i = 0; i < graph.nodes.length; i += 1) {
    const a = graph.nodes[i];
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const b = graph.nodes[j];
      const score = combinedSimilarity(a.title, a.description, a.tags, b.title, b.description, b.tags);
      if (score >= threshold) {
        pairs.push({
          a: a.id,
          b: b.id,
          score,
          reason: score > 0.8 ? 'Nearly identical text and tags' : 'Similar title, description or tags',
        });
      }
    }
  }
  return pairs.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Suggests existing nodes that a target node might connect to. */
export function suggestConnections(graph: GraphData, nodeId: string, limit = 8): SimilarityPair[] {
  const target = graph.nodes.find((node) => node.id === nodeId);
  if (!target) return [];
  const connected = new Set(
    graph.edges
      .filter((edge) => edge.source === nodeId || edge.target === nodeId)
      .map((edge) => (edge.source === nodeId ? edge.target : edge.source)),
  );
  const targetTokens = new Set(uniqueTokens(`${target.title} ${target.description}`));
  return graph.nodes
    .filter((node) => node.id !== nodeId && !connected.has(node.id))
    .map((node) => {
      const sharedTags = node.tags.filter((tag) => target.tags.includes(tag)).length;
      const textScore = combinedSimilarity(
        target.title, target.description, target.tags,
        node.title, node.description, node.tags,
      );
      const overlap = uniqueTokens(`${node.title} ${node.description}`).filter((token) => targetTokens.has(token)).length;
      return {
        a: nodeId,
        b: node.id,
        score: textScore + Math.min(0.2, overlap * 0.04) + Math.min(0.2, sharedTags * 0.1),
        reason: sharedTags > 0 ? `${sharedTags} shared tag${sharedTags > 1 ? 's' : ''}` : 'Similar local text',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
