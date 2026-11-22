# Layouts

Layouts are deterministic local functions in `src/lib/layout`. They compute or update node positions from the current graph; they do not use a server, AI API, hosted model, embedding service, or external data service.

## Layout Kinds

The layout contract defines:

- `force`
- `radial`
- `circular`
- `hierarchical`
- `tree`
- `grid`
- `cluster`
- `organic`

## Default Force Settings

The default force configuration uses:

- `repulsion`: `68`
- `attraction`: `0.018`
- `linkDistance`: `16`
- `gravity`: `0.012`
- `damping`: `0.86`
- `collision`: `3.2`
- `strength`: `1`
- `speed`: `1`

## Force Simulation

- `ForceSimulation` is mutable state outside React and Zustand.
- `useSimulation` steps the simulation and publishes positions every 8 frames via `batchMoveNodes`.
- Pinned nodes are not moved by the simulation.
- Batching avoids a store update on every animation frame.
- `reduceMotion` settings can reduce or stop animation.

## Deterministic Layouts

- `radial` — centers exploration around a focus node and radius bands.
- `circular` — places nodes on a circle.
- `hierarchical` / `tree` — use graph direction where available.
- `grid` — stable grid placement.
- `cluster` — uses deterministic clustering from `src/lib/graph`.
- `organic` — uses deterministic pseudo-random placement from stable ids.

Do not use `Math.random()` directly in layout functions; stable ids should drive any apparent randomness.

## Views and Layouts

- `3D Universe` uses stored `x`, `y`, `z` positions.
- `2D Graph` projects `x` and `z`.
- `Radial Explorer`, `Hierarchy`, and `Clusters` are view modes backed by corresponding layouts.
- Layout changes update graph positions; snapshots capture those positions with camera state.

## Pinning

- Pinned nodes stay fixed during force simulation.
- Pin state belongs to the node, so it persists with the workspace.
- Unpinning returns a node to simulation control.

## UI Access

- Use the graph controls or layout selector in the top bar/view area.
- Use the right-panel `Explore` tab for structure-driven exploration.
- Use graph pointer interactions to drag and pin nodes.

## Local-Only Guarantees

- No backend or API keys.
- No hosted layout service.
- No AI-generated placement.
- No external graph database.

## Implementation Rules

- Keep layout math independent of rendering components.
- Return positions in the same coordinate space used by graph nodes.
- Preserve node ids; layouts should not create or delete domain objects.
- Respect pinned nodes in every iterative layout.
- Keep output stable for the same input and settings.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
```

Unit tests for layout behavior live under `src/lib/layout/tests`.

See `docs/views.md`, `docs/graph-algorithms.md`, `docs/performance.md`, and `docs/persistence.md`.
