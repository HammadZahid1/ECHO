# ECHO User Guide

ECHO is a local-first knowledge graph application. It stores concepts, notes, research, people, resources, and events as nodes joined by typed relationships. It has no backend, no AI APIs, no hosted model, no embedding service, and no external data services. Algorithms and persistence run in the browser.

## Start Here

1. Open ECHO with `npm run dev` from the repository root.
2. Read the onboarding modal if it appears. Close it with **Got it**.
3. Create a node with the **New node** control in the top bar or press `N`.
4. Open **Library → All knowledge** in the left sidebar to browse nodes.
5. Open the right panel tabs — **Details**, **Explore**, **Metrics**, **Health**, **Paths**, **Time** — to inspect and analyze the graph.

The top bar view switcher offers `3D Universe`, `2D Graph`, `Radial Explorer`, `Hierarchy`, `Clusters`, `Timeline`, `Table`, and `Network Overview`.

## Local-Only Model

- Nothing is sent to a server.
- Search, clustering, path finding, and health checks are deterministic local algorithms.
- Workspaces and snapshots live in browser IndexedDB. UI preferences live in browser localStorage.
- Clearing site data can remove local workspaces and snapshots. Use **Export** to keep durable copies.

## Create and Edit Nodes

- Press `N` or use the top bar **New node** action. The initial title is `New concept`.
- Select a node to edit its title, description, node type, tags, and importance in **Details**.
- Node types: `concept`, `idea`, `note`, `research`, `question`, `project`, `person`, `resource`, `event`, `custom`.
- Delete selected nodes with `Delete` or `Backspace`; the action is undoable.

## Create Relationships

- Press `G` to switch between `select` and `connect` modes, or use the graph mode control.
- In `connect` mode, choose a source node and then a target node to create an edge.
- Relationship types: `related`, `depends`, `contradicts`, `supports`, `contains`, `derived`, `influences`, `references`, `causes`, `custom`.
- Edges are undirected for path and component algorithms; their stored direction is still available.

## Find Things

- Press `Ctrl/Cmd+K` to open the command palette for local fuzzy commands and quick node results.
- Use **Library → Search** / the search panel for weighted local search. It supports text, node type, tags, minimum importance, and connected-only filtering.
- Search weights title (`12`), tags (`7`), type (`3`), description (`3`), relationships (`2.5`), and metadata (`1.5`). There are exact/prefix title, importance, and recency bonuses.

## Workspaces and Snapshots

- Use **Settings → Workspaces** to create, rename, switch, and delete local workspaces.
- Use **Settings → Snapshots** to capture the current graph, settings, and camera; restore or compare snapshots from the same area.
- Restoring a snapshot is an undoable history action.
- Workspace bundles use `format: "echo-workspace"`, version `1`. Snapshot bundles use `format: "echo-snapshot"`, version `1`.

## Import and Export

- Open **Import** from the top bar / command palette to load JSON, CSV nodes, CSV edges, Markdown, or plain text.
- Open **Export** to write JSON, CSV nodes, CSV edges, Markdown, SVG, or PNG.
- Export scopes: `all`, `selected`, `cluster`, `filtered`.
- SVG and PNG exports are 2D projections from stored positions, not screenshots of the live 3D canvas.

## Inspect Graph Structure

- **Explore** shows neighborhood, connected components, and related structural tools.
- **Paths** exposes shortest path and path finding; the default path search uses `maxLength=6` and `limit=5`.
- **Metrics** shows local graph statistics.
- **Health** lists local issues such as isolated, untagged, undescribed, contradictory, or duplicate-risk nodes and edges.
- **Time** uses timestamps already stored on nodes and edges.

## Undo and Redo

- `Ctrl/Cmd+Z` undoes the last history entry.
- `Ctrl/Cmd+Shift+Z` and `Ctrl/Cmd+Y` redo.
- History is per workspace, trimmed to `120` entries, and can be cleared from **Settings**.

## Quality Settings

- **Settings** exposes `reduceMotion`, `highContrast`, `largeText`, and `screenReaderGraphSummary`.
- `useReducedMotion` also honors the operating system `prefers-reduced-motion` setting.
- The `screenReaderGraphSummary` preference is defined but has no observed consumer in the current code.

## Verify the Build

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

See `docs/shortcuts.md`, `docs/views.md`, `docs/search.md`, `docs/import-export-guide.md`, `docs/workspaces-snapshots.md`, `docs/health-metrics.md`, `docs/accessibility.md`, and `docs/troubleshooting.md` for details.
