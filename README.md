# ECHO

> A local-first knowledge intelligence environment for building, exploring, and understanding interconnected ideas.

ECHO turns notes, concepts, research, questions, and references into a living knowledge graph. It combines an immersive 3D universe, a precise 2D graph, transparent local algorithms, and a premium research-workstation interface — entirely in the browser, with no backend, no API keys, and no external services.

## Vision

Most note tools store information in flat lists or rigid folders. ECHO treats knowledge as a network: every idea is a node, every relationship is an edge, and meaning emerges from structure. The platform is designed for sense-making — finding hidden connections, seeing clusters, tracing paths between concepts, and watching a personal knowledge universe grow over time.

## Planned capabilities

- **Knowledge graph** — typed nodes, directed/undirected relationships, tags, metadata, importance, references.
- **Visualization** — interactive 3D universe (Three.js / React Three Fiber), full 2D graph, radial, hierarchical, cluster, table, network, and timeline views.
- **Layout engine** — force-directed physics, radial, circular, tree, grid, cluster, and organic layouts with live controls.
- **Analysis** — connected components, community detection, path finding, graph health checks, real statistics, growth analytics.
- **Knowledge tools** — inspector, search engine, command palette, clusters, snapshots, graph comparison, import/export.
- **Organization** — multiple workspaces, collections, tags, snapshots, local persistence with IndexedDB.
- **Experience** — keyboard shortcuts, context menus, onboarding, responsive layouts, accessibility and reduced-motion support.

## Technology

React · TypeScript · Vite · Three.js · React Three Fiber · Drei · Zustand · Tailwind CSS · Framer Motion · D3 · Lucide React · IndexedDB · Vitest · React Testing Library · Playwright (where available)

## Status

Active development. See [docs/ROADMAP.md](docs/ROADMAP.md) for the engineering plan and [docs/architecture.md](docs/architecture.md) for the system design.

## Getting started

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm run test
```

All data stays in the browser. ECHO never sends knowledge to a server.
