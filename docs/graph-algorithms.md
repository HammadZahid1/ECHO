# Graph Algorithms

All graph algorithms are deterministic, local functions in `src/lib/graph`. ECHO has no backend, no AI APIs, no hosted model, no embedding service, and no external data services.

## Adjacency

`buildAdjacency` produces:

- `out` — outgoing edges by node id.
- `incoming` — incoming edges by node id.
- `all` — all incident edges.
- `degree` — total degree.

Edges have a stored type and direction, but most traversal algorithms use the undirected projection unless they explicitly read `out` or `incoming`.

## Traversal

- `breadthFirst` — level-order traversal from a start node.
- `depthFirst` — depth-order traversal from a start node.
- `neighborhood` — nodes within a radius of a start node.
- `connectedComponents` — groups of nodes connected through any edges.

Traversal order depends on adjacency construction order; keep inputs stable for reproducible results.

## Paths

- `shortestPath` — unweighted BFS over the undirected projection.
- `findPaths` — enumerates simple paths with defaults `maxLength=6` and `limit=5`.
- `pathWaypoints` — converts a path into waypoints for UI display or animation.

A "shortest path" in ECHO means fewest edges, not lowest cost or semantic similarity.

## Clustering

`src/lib/graph` provides deterministic clustering methods:

- `component` — one cluster per connected component.
- `label propagation` — deterministic label propagation.
- `tag` — group by shared tags.
- `text similarity` — union-find over local text similarity.
- `neighborhood` — group by local adjacency.

`estimateModularity` is an internal-edge fraction proxy; it is not classic modularity.

## Similarity

Similarity is local text analysis only:

- title bigram overlap
- description token overlap
- shared tags

There are no embeddings, no language model calls, and no external similarity service.

## Filters and Validation

`src/lib/graph` also contains graph filters and validation helpers used by panels and import. They operate on the in-memory graph before persistence.

## Health

`analyzeHealth` computes a score of `100 - penalty`, where issue penalties are:

- critical: `12`
- warning: `4`
- info: `1`

Fixes include:

- `add-tag`
- `describe`
- `connect`
- `merge`
- `delete-edge`

See `docs/health-metrics.md`.

## Panel Access

- `Explore` tab: neighborhood/components/related structure.
- `Paths` tab: shortest path and path finding.
- `Clusters` view: deterministic community detection.
- `Health` tab: issues and fixes.

## Determinism Rules

- Do not introduce randomness into graph algorithms.
- Do not call network services from algorithm modules.
- Preserve stable ordering where output is displayed, since UI and tests rely on it.
- Keep algorithm code independent of React and Zustand; stores call algorithms and render results.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
```

Unit tests for graph algorithms live under `src/lib/graph/tests`.

See `docs/architecture.md`, `docs/views.md`, `docs/health-metrics.md`, and `docs/performance.md`.
