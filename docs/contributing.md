# Contributing

ECHO is local-first. Contributions must preserve the core constraint: no backend, no AI APIs, no hosted model, no embedding service, and no external data services.

## Project Layout

- `src/types` — domain contracts.
- `src/store` — Zustand stores, history, selectors.
- `src/hooks` — keyboard shortcuts and derived hooks.
- `src/components/shell` — top bar, sidebar, status bar, modals, context menu, app shell.
- `src/components/panels` — Details, Explore, Metrics, Health, Paths, Time, search, settings.
- `src/components/graph` — 2D/3D renderers, viewport, controls, simulation hook.
- `src/components/views` — view-mode behavior.
- `src/lib/graph` — deterministic graph algorithms.
- `src/lib/layout` — deterministic layouts and force simulation.
- `src/lib/search` — local indexing, scoring, highlighting, fuzzy commands.
- `src/lib/importers`, `src/lib/exporters`, `src/lib/persistence` — local IO and storage.

## Ground Rules

- Keep graph data and algorithms independent of React where practical.
- Do not add network calls for graph operations.
- Do not add model calls, embedding endpoints, API keys, or telemetry.
- Do not introduce randomness into deterministic algorithms.
- Keep persistence browser-local.
- Preserve stable node/edge ids.
- Respect pinned nodes in simulation and layout code.
- Keep history entries undoable for graph mutations.

## Style

- Follow `docs/architecture.md` and `docs/formats.md`: terse, concrete, source-grounded Markdown.
- Prefer exact names, values, and paths over marketing language.
- Do not claim unimplemented features.
- Document caveats explicitly, such as:
  - TopBar label/icon mismatches.
  - `screenReaderGraphSummary` has no observed consumer.
  - SVG/PNG exports are 2D projections, not live 3D captures.
  - `npm run test:e2e` exists, but no browser e2e files were found.

## Verification Commands

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Optional during development:

```powershell
npm run dev
npm run preview
npm run test:watch
npm run test:coverage
```

## Algorithm Changes

- Add or update tests under `src/lib/graph/tests` or `src/lib/layout/tests`.
- Keep defaults documented, including `findPaths` `maxLength=6`, `limit=5`.
- Keep health penalties documented: critical `12`, warning `4`, info `1`.
- Keep `estimateModularity` described as an internal-edge fraction proxy.

## UI Changes

- Update `docs/views.md` for new view modes or panel tabs.
- Update `docs/shortcuts.md` if keyboard bindings change.
- Update `docs/user-guide.md` for new user-facing flows.
- Update `docs/accessibility.md` for new settings or behavior.
- Respect the input/contenteditable guard in `useKeyboardShortcuts.ts`.

## IO Changes

- Update `docs/formats.md` and `docs/import-export-guide.md`.
- Preserve format markers:
  - `echo-workspace` version `1`
  - `echo-snapshot` version `1`
- Keep import defaults documented.
- Keep CSV requirements documented: node `title`, edge `source` and `target`, `|` separators.

## Persistence Changes

- Update `docs/persistence.md` and `docs/workspaces-snapshots.md`.
- Preserve IndexedDB database `echo-knowledge`, version `1`, stores `workspaces`, `snapshots`, `history`, `meta`, unless intentionally migrating.
- Preserve localStorage key `echo.preferences.v1` or document migration.
- Keep debounced saving at `700` ms unless performance work justifies a change.

## Documentation Changes

- Do not modify unrelated docs or source files.
- Verify claims against source before writing.
- Keep examples concrete and ECHO-specific.
- Verify final line counts if requested.

See `docs/testing.md` for test details and `docs/troubleshooting.md` for common local failures.
