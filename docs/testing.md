# Testing

ECHO is verified locally with TypeScript, ESLint, Vitest, Playwright, and a production build. There is no backend, AI API, hosted model, embedding service, or external data service involved in the test suite.

## Commands

From the repository root:

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

`npm run test:e2e` uses `playwright.config.ts`. The config starts the local Vite dev server on `http://127.0.0.1:4174` and runs the specs in `e2e/` with Chromium.

## Verified Results

The final verification pass recorded:

- `npm run typecheck`: clean
- `npm run lint`: clean
- `npm run test`: 117 test files, 796 tests passed
- `npm run test:e2e`: 17 browser tests passed
- `npm run build`: succeeded, 2828 modules transformed

These results describe the local Chromium and Node environment used for development. They are not a claim of coverage for every browser/device combination.

## Vitest Configuration

- Environment: `jsdom`
- Setup file: `./src/test/setup.ts`
- Include: `src/**/*.{test,spec}.{ts,tsx}`
- Exclude: `node_modules`, `dist`, `e2e`

## Test Locations

Unit and component tests live under:

- `src/lib/graph/tests`
- `src/lib/layout/tests`
- `src/lib/search/tests`
- `src/lib/importers/tests`
- `src/lib/exporters/tests`
- `src/lib/persistence/tests`
- `src/lib/utils/tests`
- `src/components/ui/tests`
- `src/components/shell/tests`
- `src/components/panels/tests`
- `src/components/views/tests`
- `src/components/graph/tests`
- `src/hooks/tests`
- `src/store/tests`
- `src/data/demo/tests`
- `src/test/smoke.test.ts`

Browser tests live under `e2e/`.

## What Is Covered

- graph adjacency, traversal, paths, clustering, health, validation, and factories
- deterministic layouts, physics stepping, and layout dispatch
- search indexing, weighted scoring, fuzzy matching, and highlighting
- local import and export pipelines, including malformed input
- IndexedDB schema, migrations, preferences, and debounced saves
- UI primitives, dialogs, menus, controls, toasts, and empty/error states
- shell composition, navigation, status reporting, and collection management
- panels for search, import/export, settings, analytics, health, paths, snapshots, timelines, and workspaces
- views such as radial, hierarchy, cluster, table, network, and timeline explorers
- hooks, Zustand stores, selectors, and demo dataset invariants
- Playwright flows for navigation, shortcuts, creation/undo, search, import/export, settings persistence, layouts, context menus, and reload persistence

## What Is Not Covered

- WebGL rendering internals or GPU-specific behavior
- real-device browser matrices or visual regression baselines
- a formal screen reader audit
- network behavior, because the application intentionally has no backend

## Test Style

- Keep algorithm tests deterministic.
- Use stable ids and fixed inputs.
- Avoid wall-clock dependence except where recency is the behavior under test.
- Do not call network services.
- Prefer behavior-level assertions based on roles, labels, and visible state.

## Manual Verification

For UI behavior, start:

```powershell
npm run dev
```

Then check shortcuts, views, import/export, workspaces, snapshots, persistence, and accessibility settings manually. See `docs/shortcuts.md`, `docs/views.md`, `docs/accessibility.md`, and `docs/user-guide.md`.

## Local-Only Guarantees

- Tests run without servers other than the local Vite/Playwright harness.
- No API keys are required.
- No hosted services are contacted.
- No embedding or model endpoints are needed.

See `docs/architecture.md`, `docs/performance.md`, and `FINAL_VERIFICATION.md`.
