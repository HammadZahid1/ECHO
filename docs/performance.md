# Performance

ECHO performance work is local: rendering, algorithms, and persistence run in the browser. There is no backend, no AI API, no hosted model, no embedding service, and no external data service.

## Rendering

- `3D Universe` uses `GraphCanvas3D` with `InstancedMesh` for nodes.
- `2D Graph` uses Canvas 2D and projects `x`/`z`.
- Quality presets affect starfield density and visual cost.
- SVG/PNG exports are static 2D projections, not live canvas captures.

## Simulation

- `ForceSimulation` is mutable state outside React and Zustand.
- `useSimulation` publishes positions every 8 frames via `batchMoveNodes`.
- Pinned nodes are not moved.
- Batching prevents one store update per frame.
- `reduceMotion` settings can reduce or stop animation.

## Store Updates

- Keep high-frequency simulation data out of React state.
- Publish positions in batches.
- Avoid per-frame derived selectors that scan the entire graph.
- Use graph ids for stable references and memoization.

## Search and Algorithms

- Search has a `180` ms debounce and a `40` result limit in the panel.
- `findPaths` defaults to `maxLength=6` and `limit=5`.
- Clustering and health analyses are deterministic and run locally.
- Keep algorithm modules pure and independent of stores where practical.

## Persistence

- `graphStore` uses `createDebouncedSaver(700)`.
- IndexedDB stores `workspaces`, `snapshots`, `history`, and `meta`.
- localStorage key is `echo.preferences.v1`.
- History is per workspace and trimmed to `120` entries.

## Batching Details

- The simulation step owns mutable node velocities and forces.
- React only sees published positions from `batchMoveNodes`.
- Publishing every 8 frames reduces render churn while keeping motion visually continuous.
- Pinned nodes are skipped, which also reduces unnecessary store writes.
- Camera movement and selection should stay separate from simulation position updates.

## Algorithm Boundaries

- Search result limiting happens at the panel boundary (`40`), keeping the scorer reusable.
- Path enumeration is bounded by `maxLength=6` and `limit=5` by default.
- Health and metrics recompute from the current in-memory graph; they do not maintain external caches.
- Clustering is deterministic local work; avoid adding model-based or remote ranking.

## Large Graph Guidance

- Prefer `2D Graph` or `Table` if 3D rendering is costly.
- Reduce visual quality in 3D when starfield/effects are expensive.
- Use filters/search to reduce displayed scope.
- Pin stable nodes to reduce simulation churn.
- Export snapshots before major structural experiments.

## Do Not Add

- No remote telemetry.
- No server-side graph indexing.
- No external GPU service.
- No model-based summarization or embedding calls.
- No unbounded history or path enumeration.

## Profiling Workflow

1. Run `npm run dev`.
2. Reproduce with a representative local workspace.
3. Use browser Performance and Memory tools.
4. Check store update frequency, simulation frame batching, and render cost.
5. Verify persistence does not block interaction.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

See `docs/layouts.md`, `docs/search.md`, `docs/persistence.md`, and `docs/testing.md`.
