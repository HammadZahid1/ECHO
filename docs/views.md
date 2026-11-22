# Views

ECHO has two related concepts: top-bar view modes and right-panel analysis tabs. Both are local rendering of the same workspace graph. There is no backend, no AI APIs, no hosted model, and no external data services; view transformations use deterministic local algorithms and read browser-local persistence.

## Top-Bar View Modes

The top bar exposes these labels:

- `3D Universe`
- `2D Graph`
- `Radial Explorer`
- `Hierarchy`
- `Clusters`
- `Timeline`
- `Table`
- `Network Overview`

Some top-bar controls use icons whose labels do not match the view they set. The `Graph health` icon sets `network` view; the `Analytics` icon sets `timeline` view. Actual Metrics and Health panels are right-panel tabs.

## 3D Universe

- Renderer: `GraphCanvas3D` with `InstancedMesh` nodes and line-based edges.
- Uses stored `x`, `y`, and `z` positions.
- Supports camera orbit/zoom, node selection, pinning, and drag positioning.
- Visual quality presets affect starfield density and other visual cost.
- `reduceMotion` settings influence simulation/animation behavior.

## 2D Graph

- Renderer: Canvas 2D.
- Projects the 3D position onto `x` and `z` via `projectGraph`.
- Uses the same selection, edge, and pin data as 3D.
- This is the projection used for SVG/PNG export.

## Radial Explorer

- Places nodes by the deterministic `radial` layout.
- Centers exploration on a selected/focus node and its neighborhood.
- Does not imply a different graph; it is a layout and camera choice.

## Hierarchy

- Uses hierarchical/tree placement from `src/lib/layout`.
- Best for graphs with `contains`, `depends`, or other directional structure.
- Directionality is a visual cue; graph algorithms still treat edges as undirected unless they explicitly use `out` or `incoming`.

## Clusters

- Uses deterministic community detection from `src/lib/graph`.
- Methods include component, label propagation, tag, text similarity, and neighborhood clustering.
- `estimateModularity` is an internal-edge fraction proxy, not classic modularity.

## Timeline

- Orders or filters by node/edge timestamps already in the graph.
- No external calendar service or time API is used.

## Table

- Tabular browsing of nodes with underlying properties.
- Useful when spatial layout is not the primary task.

## Network Overview

- Broad structural view of the graph.
- Reached by the top-bar `Graph health` icon as currently wired.

## Right-Panel Tabs

`AppShell.tsx` defines right tabs:

- `Details` — selected node/edge properties.
- `Explore` — neighborhood and related structural exploration.
- `Metrics` — graph statistics.
- `Health` — local issues and fixes.
- `Paths` — shortest path and path finding.
- `Time` — timestamp-oriented inspection.

## View State

- Active view and panel state live in UI state, not in the graph domain model.
- Camera state is captured in snapshots for restore.
- Layouts may mutate node positions in the graph store; pinning prevents movement of pinned nodes.
- The force simulation publishes positions every 8 frames via `batchMoveNodes`.

## Local-Only Guarantees

- No backend or hosted renderer is involved.
- No AI APIs or embedding services are used for view computation.
- All graph algorithms are deterministic local functions.
- Workspaces, snapshots, and preferences stay browser-local.

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
```

Manual check each mode with `npm run dev`, especially the mismatched icon labels noted above.

See `docs/layouts.md`, `docs/graph-algorithms.md`, and `docs/health-metrics.md`.
