# ECHO Architecture

## Guiding constraints

- **Local-first.** All knowledge stays in the browser. No server, no API keys, no external data services.
- **No fabricated intelligence.** Cluster, health, and similarity features use explicit, documented local algorithms.
- **Separation of concerns.** Algorithms are pure functions; stores orchestrate state; React renders it.
- **Strict typing.** Domain entities have explicit interfaces and discriminated unions.

## Module boundaries

```
src/
  types/          Domain contracts (nodes, edges, workspaces, analytics, UI)
  lib/
    graph/        Pure graph algorithms: traversal, paths, clusters, stats, health
    layout/       Pure layout computations and the force simulation core
    search/       Local indexing, scoring, highlighting
    importers/    JSON, CSV, Markdown and plain-text parsing/validation
    exporters/    JSON, CSV, Markdown, SVG and PNG serializers
    persistence/  IndexedDB abstraction, migrations, local preference helpers
    utils/        IDs, time, text, color, math, download helpers
  store/          Zustand stores and history/undo-redo orchestration
  components/
    ui/           Design-system primitives
    shell/        Application chrome, navigation, panels
    graph/        2D/3D renderers and interaction layers
    panels/       Feature panels (inspector, analytics, health, snapshots, ...)
    views/        Visualization mode wrappers
  data/demo/      Curated demo knowledge universes
  hooks/          Reusable React hooks
  styles/         Design tokens and global styles
```

## Data flow

1. User action in a component dispatches a typed store action.
2. The store validates input and calls a pure graph operation.
3. The store records a history entry and persists the change (debounced/batched).
4. Selectors derive adjacency, statistics, clusters, and filtered views.
5. Renderers subscribe to the minimal slices they need and update.

## Simulation vs UI state

Layout positions live in graph state so they can be persisted and undone, but the running force simulation is kept in a separate mutable engine that publishes throttled position updates. This prevents 60 Hz physics work from re-rendering the entire interface.

## Rendering strategy

- Large node sets are rendered with instanced meshes in 3D where practical.
- Edges use shared geometry/material resources and are rebuilt only when topology changes.
- Labels, halos, and particles are toggled by quality presets.
- The 2D graph uses Canvas 2D for high node counts and SVG-style hit-testing logic.
- WebGL failure falls back to a functional 2D representation.

## Persistence strategy

- IndexedDB stores workspaces, graph data, snapshots, history, and collections.
- LocalStorage stores lightweight preferences (panel layout, active view, theme).
- Writes are debounced and batched; hydration is validated before it reaches stores.
- Schema versioning enables forward migration and corrupt-data recovery.

## Testing strategy

Pure algorithms are covered with deterministic unit tests. Interaction-heavy components are covered with React Testing Library. Critical user flows are covered with Playwright where browser binaries are available.
