# ECHO

> A local-first knowledge intelligence environment for building, exploring, and understanding interconnected ideas.

ECHO turns notes, concepts, research, questions, and references into a living knowledge graph. It combines an immersive 3D universe, a precise 2D graph, transparent local algorithms, and a research-workstation interface — entirely in the browser, with no backend, no API keys, and no external services.

## Vision

Most note tools store information in flat lists or rigid folders. ECHO treats knowledge as a network: every idea is a node, every relationship is an edge, and meaning emerges from structure. The platform is designed for sense-making: finding hidden connections, seeing clusters, tracing paths between concepts, and watching a personal knowledge universe grow over time.

## Capabilities

- **Knowledge graph** — typed nodes, directed/undirected relationships, tags, metadata, importance, references, collections and workspaces.
- **Visualization** — interactive 3D universe (Three.js / React Three Fiber), 2D canvas graph, radial, hierarchical, cluster, table, network and timeline views.
- **Layout engine** — force-directed physics plus radial, circular, tree, grid, cluster and organic layouts with live controls.
- **Analysis** — connected components, deterministic clustering, shortest and alternate paths, graph health diagnostics, real statistics and growth analytics.
- **Knowledge tools** — node/relationship inspector, weighted search, command palette, path finder, snapshots, snapshot comparison, import and export.
- **Organization** — multiple local workspaces, renameable/deletable collections, tags, snapshots, and IndexedDB persistence with local preference storage.
- **Experience** — keyboard shortcuts, context menus, onboarding, responsive layouts, high-contrast and reduced-motion support, and an optional screen-reader graph summary.

## Technology

React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Zustand, Tailwind CSS, Framer Motion, D3, Lucide React, IndexedDB, LocalStorage, Vitest, React Testing Library, and Playwright where available.

## Getting started

```bash
npm install
npm run dev
```

Verification:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

The final local verification passed TypeScript, ESLint, 796 Vitest tests across 117 files, 17 Playwright browser tests, and the production build. See `FINAL_VERIFICATION.md` for details and limitations.

All data stays in the browser. ECHO never sends knowledge to a server. Use export if you want portable copies of your work.

## Project map

- `src/types` — domain model shared by every layer.
- `src/lib/graph` — pure graph algorithms and analysis.
- `src/lib/layout` — deterministic layouts and the mutable force simulation.
- `src/lib/search` — local indexing, scoring, fuzzy matching and highlighting.
- `src/lib/importers` and `src/lib/exporters` — local format pipelines.
- `src/lib/persistence` — IndexedDB schema, migrations, repository and preferences.
- `src/store` — Zustand state with undo/redo and derived selectors.
- `src/components` — shell, renderers, views, panels and UI primitives.
- `docs/ROADMAP.md` — engineering plan and task ledger.
- `docs/architecture.md` — design decisions and data flow.
- `docs/formats.md` — import/export format reference.
- `FINAL_VERIFICATION.md` — final verification results and honest limitations.

## Honesty notes

Graph intelligence in ECHO is based on transparent, deterministic local algorithms. There is no hosted model, no embedding service, and no AI API. Health scores and cluster labels are heuristics computed from the graph itself and are presented as such in the interface.
