# Testing

ECHO tests are local unit tests with Vitest. There is no backend, no AI API, no hosted model, no embedding service, and no external data service involved in the test suite.

## Commands

From the repository root:

```powershell
npm run test
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

`npm run test:e2e` exists as a script in `package.json`, but no browser e2e test files were found in the current source tree.

## Vitest Configuration

- Environment: `jsdom`
- Setup file: `./src/test/setup.ts`
- Include: `src/**/*.{test,spec}.{ts,tsx}`
- Exclude: `node_modules`, `dist`, `e2e`

## Test Locations

Existing unit tests live under:

- `src/lib/graph/tests`
- `src/lib/layout/tests`
- `src/lib/search/tests`
- `src/lib/persistence/tests`
- exporter/importer/utility test files under `src/lib`

`src/test/smoke.test.ts` only checks that `1 + 1 === 2`.

## What Is Covered

- graph adjacency, traversal, paths, clustering, health
- layout math and force behavior
- search indexing and scoring
- import/export serialization
- persistence helpers

## What Is Not Covered

- full browser interaction flows
- 3D rendering behavior
- keyboard shortcut integration in a real browser
- UI panel interactions beyond unit-level helpers

Do not describe the suite as browser e2e coverage.

## Test Style

- Keep algorithm tests deterministic.
- Use stable ids and fixed inputs.
- Do not rely on wall-clock time unless explicitly testing recency behavior.
- Do not call network services.
- Avoid mocking AI APIs; none should exist.

## Adding Tests

1. Place tests next to the module under a `tests` directory or as a `.test.ts` file under `src`.
2. Import public functions rather than private internals where possible.
3. Assert exact outputs for deterministic algorithms.
4. Run `npm run test` and `npm run typecheck` before submitting changes.

## Verification Before Documentation Changes

Even documentation-only changes should not break known commands:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

## Manual Verification

For UI behavior, start:

```powershell
npm run dev
```

Then check shortcuts, views, import/export, workspaces, snapshots, and accessibility settings manually. See `docs/shortcuts.md`, `docs/views.md`, `docs/accessibility.md`, and `docs/user-guide.md`.

## Local-Only Guarantees

- Tests run without servers.
- No API keys are required.
- No hosted services are contacted.
- No embedding or model endpoints are needed.

See `docs/architecture.md` and `docs/performance.md`.
