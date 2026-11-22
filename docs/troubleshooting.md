# Troubleshooting

ECHO is local-only: no backend, no AI APIs, no hosted model, no embedding service, and no external data service. Most problems are therefore local storage, local file, browser, or rendering issues.

## App Does Not Start

Run from the repository root:

```powershell
npm install
npm run dev
```

Also check:

```powershell
npm run typecheck
npm run build
```

Use the Node/npm version expected by the project. If dependency installation fails, remove stale local install artifacts and reinstall.

## Workspace Disappears After Reload

- Workspaces are in IndexedDB database `echo-knowledge`, version `1`.
- Preferences are in localStorage key `echo.preferences.v1`.
- Clearing site data removes them.
- Private browsing may discard them between sessions.

Restore from an exported workspace JSON if available.

## Status Shows a Storage Problem

The status bar displays `Local · <storageStatus>`.

Check:

- browser storage quota
- private/incognito mode
- site data blocking
- disk space
- IndexedDB availability

`graphStore` saves after a debounce; wait briefly before assuming a save failed.

## Undo/Redo Does Not Work

- History is per workspace and trimmed to `120` entries.
- **Clear history** in Settings removes entries.
- Shortcuts: `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+Y`.
- `snapshot.restore` is undoable.

If history is empty after switching workspaces, use the correct workspace.

## Shortcuts Do Nothing

- Most shortcuts are ignored in `INPUT`, `TEXTAREA`, and `contenteditable`.
- `Ctrl/Cmd+K` and `Escape` still run while typing.
- `Delete` / `Backspace` require a graph selection.
- `F` focuses the first selected node.
- `G` toggles select/connect mode.

See `docs/shortcuts.md`.

## Import Fails

- Check detected format; override it if wrong.
- CSV nodes require `title`.
- CSV edges require `source` and `target`.
- Tags/references use `|`.
- Use `createMissingNodes=true` when edge endpoints are absent.
- Keep `mergeById=true` to avoid duplicate ids.
- Validate JSON structure before import.

See `docs/import-export-guide.md`.

## Exported Image Looks Wrong

SVG and PNG exports use `projectGraph` from stored positions. They are 2D projections of `x`/`z`, not screenshots of the live 3D canvas. Camera angle, lighting, and depth are not preserved.

## Health Score Is Low

Health score is `100 - penalty`, with critical `12`, warning `4`, and info `1`. Open the right-panel `Health` tab and apply suggested fixes such as `add-tag`, `describe`, `connect`, `merge`, or `delete-edge`.

## Search Misses Expected Nodes

- Search is exact local text matching, not semantic search.
- No embeddings or AI ranking are used.
- Check filters: node type, tags, minimum importance, connected only.
- The search panel limits results to `40`.
- `Ctrl/Cmd+K` is fuzzy command navigation with up to five quick node results, not full-text search.

## View or Icon Seems Mislabeled

- `Graph health` icon sets `network` view.
- `Analytics` icon sets `timeline` view.
- Real Health and Metrics panels are right tabs.

See `docs/views.md`.

## Motion or Text Looks Wrong

Check **Settings** for `reduceMotion`, `highContrast`, and `largeText`. `useReducedMotion` also respects OS `prefers-reduced-motion`.

`screenReaderGraphSummary` is defined but has no observed consumer.

## Performance Problems

- Reduce 3D quality presets.
- Use 2D or Table view.
- Filter the graph.
- Pin stable nodes.
- Avoid very large path searches; defaults are `maxLength=6`, `limit=5`.

See `docs/performance.md`.

## Verification Checklist

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

If all pass but behavior is wrong, reproduce in `npm run dev` with a minimal local workspace and no imported untrusted data.
