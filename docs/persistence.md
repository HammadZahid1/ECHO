# Persistence

ECHO persistence is browser-local. There is no backend, no AI API, no hosted model, no embedding service, and no external data service.

## Storage Targets

### IndexedDB

- Database: `echo-knowledge`
- Version: `1`
- Stores:
  - `workspaces`
  - `snapshots`
  - `history`
  - `meta`

IndexedDB holds workspaces, snapshots, history, and metadata.

### localStorage

- Key: `echo.preferences.v1`

localStorage holds UI preferences such as view, panel, and accessibility settings.

## Debounced Saving

`graphStore` uses `createDebouncedSaver(700)`. Edits are coalesced into a local save after roughly 700 ms of inactivity.

The status bar displays:

```text
Local · <storageStatus>
```

## Workspaces

Each workspace is stored as a local bundle:

```json
{ "format": "echo-workspace", "version": 1 }
```

Workspace switching loads the corresponding graph, selection, camera, and history context.

## Snapshots

Snapshots are stored locally as:

```json
{ "format": "echo-snapshot", "version": 1 }
```

They contain the complete graph plus settings and camera state. Restore is undoable via `snapshot.restore`.

## History

- History is per workspace.
- It is trimmed to `120` entries.
- **Clear history** is available in Settings.
- Undo/redo shortcuts are global.

## Imports and Exports

- Import reads local files into the active workspace.
- Export writes local files from graph or projected data.
- No file content is uploaded.

See `docs/import-export-guide.md` and `docs/workspaces-snapshots.md`.

## Failure Modes

- Clearing site data removes IndexedDB and localStorage state.
- Private browsing may discard storage between sessions.
- Storage quota errors should surface through storage status.
- Malformed imported bundles can break loading; keep exported backups.

## Safety Rules

- Keep backup exports for important workspaces.
- Do not store secrets in node metadata; data is local but not encrypted by ECHO.
- Do not assume IndexedDB survives browser profile changes.
- Validate format and version before loading bundles.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
```

Persistence tests live under `src/lib/persistence/tests`.

See `docs/architecture.md`, `docs/formats.md`, and `docs/troubleshooting.md`.
