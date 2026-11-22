# Workspaces and Snapshots

Workspaces and snapshots are browser-local bundles managed through Zustand stores and `src/lib/persistence`. ECHO has no backend, no AI APIs, no hosted model, no embedding service, and no external data service.

## Workspaces

A workspace is an isolated graph plus its local state. Use **Settings → Workspaces** to:

- create a workspace
- rename a workspace
- switch the active workspace
- delete a workspace

Workspace bundles use:

```json
{ "format": "echo-workspace", "version": 1 }
```

## Active Workspace

- The graph store is scoped to the active workspace.
- History is per workspace.
- Switching workspaces changes the graph, selection, and camera context.
- Unsaved changes are persisted locally through the debounced saver.

## Snapshots

A snapshot captures the complete graph plus settings and camera state. Use **Settings → Snapshots** to:

- create a snapshot
- restore a snapshot
- compare snapshots
- export/import snapshot bundles where exposed by the UI

Snapshot bundles use:

```json
{ "format": "echo-snapshot", "version": 1 }
```

## Restore

- Restoring a snapshot replaces the current workspace state with the captured state.
- Restore is recorded as `snapshot.restore` in history.
- It can be undone with `Ctrl/Cmd+Z`.

## Compare

Snapshot compare is structural and property-level:

- compares by node and edge id
- compares graph signatures
- compares settings and camera where present

It does not use AI, embeddings, or semantic diffing.

## Persistence

- IndexedDB database: `echo-knowledge`
- IndexedDB version: `1`
- IndexedDB stores: `workspaces`, `snapshots`, `history`, `meta`
- localStorage key: `echo.preferences.v1`

`graphStore` uses `createDebouncedSaver(700)`. The status bar shows `Local · <storageStatus>`.

## History

- History is trimmed to `120` entries.
- **Clear history** is in Settings.
- History belongs to a workspace, not to a snapshot.
- Undo/redo shortcuts: `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+Y`.

## Local-Only Guarantees

- No cloud sync.
- No account or server-side workspace.
- No hosted snapshot storage.
- No external diffing service.

## Safety Notes

- Export important workspaces/snapshots to JSON before clearing browser data.
- Import bundles with matching format and version.
- Bad bundles can contain duplicate ids or invalid timestamps; validate before relying on them.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
```

Persistence tests live under `src/lib/persistence/tests`.

See `docs/persistence.md`, `docs/formats.md`, `docs/import-export-guide.md`, and `docs/user-guide.md`.
