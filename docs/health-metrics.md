# Health and Metrics

Health and metrics are deterministic local analyses in `src/lib/graph`. ECHO has no backend, no AI APIs, no hosted model, no embedding service, and no external data service.

## Open the Panels

Right-panel tabs in `AppShell.tsx`:

- `Metrics` — graph statistics.
- `Health` — issues and fixes.

The top-bar `Graph health` icon sets `network` view, and the `Analytics` icon sets `timeline` view; the actual Health and Metrics panels are the right tabs.

## Health Score

`analyzeHealth` computes:

```text
score = 100 - penalty
```

Issue penalties:

| Severity | Penalty |
| --- | ---: |
| critical | `12` |
| warning | `4` |
| info | `1` |

## Issue Types

Health checks look for local structural and metadata problems such as:

- isolated nodes
- missing tags
- missing descriptions
- contradictory or suspicious relationships
- duplicate-risk nodes or edges

Each issue carries a severity and a suggested fix.

## Fixes

Fix actions include:

- `add-tag`
- `describe`
- `connect`
- `merge`
- `delete-edge`

Fixes are performed in the workspace graph and are undoable through history.

## Metrics

Graph statistics include local counts and structural measures derived from adjacency:

- node and edge counts
- degree information
- component counts
- path/cluster-related statistics

Metrics are computed from the in-memory graph, not from a server or analytics pipeline.

## Adjacency Basis

`buildAdjacency` provides:

- `out`
- `incoming`
- `all`
- `degree`

Edges have direction in storage, but undirected adjacency is used for most structural metrics.

## Clusters and Modularity

Clustering methods include component, deterministic label propagation, tag, text similarity, and neighborhood clustering. `estimateModularity` is an internal-edge fraction proxy, not classic modularity.

## Time Metrics

The `Time` tab uses timestamps stored on nodes and edges. No external calendar or event service is used.

## Local-Only Guarantees

- No telemetry.
- No hosted analytics.
- No model-based grading.
- No external health service.

## Implementation Rules

- Keep health rules deterministic and explainable.
- Do not introduce random sampling.
- Do not call network APIs from health or metrics code.
- Keep fixes as graph mutations that produce history entries.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
```

Graph tests live under `src/lib/graph/tests`.

See `docs/graph-algorithms.md`, `docs/views.md`, and `docs/user-guide.md`.
