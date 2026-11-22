# Import and Export Guide

ECHO import and export are local file pipelines in `src/lib/importers` and `src/lib/exporters`. Files are read and written in the browser. There is no backend, no AI API, no hosted model, no embedding service, and no external data service.

## Open the Dialogs

- **Import** is available from the top bar / command palette.
- **Export** is available from the top bar / command palette.
- Modal IDs include `import` and `export`.

## Import Formats

- JSON
- CSV nodes
- CSV edges
- Markdown
- plain text

`detectFormat` uses filename and content heuristics. Override the detected format when the heuristic is wrong.

## Import Options

Defaults:

- `createMissingNodes=false`
- `mergeById=true`
- `generateMissingIds=true`
- `preserveTimestamps=true`
- `importMetadata=true`
- `nodeHierarchy=true`
- `relationParsing=true`

`createMissingNodes` allows edge endpoints to become nodes. `mergeById` updates existing ids instead of duplicating them. `generateMissingIds` creates ids when source data lacks them.

## CSV Nodes

Required column:

- `title`

Common optional fields include id, description, type, tags, importance, and timestamps. Tags and references use `|` as a separator.

## CSV Edges

Required columns:

- `source`
- `target`

Optional fields include id, relationship type, label, description, and timestamps. Set `createMissingNodes=true` if endpoints are not already present.

## Markdown Import

- Headings become nodes.
- The first level-1 heading becomes the document title.
- `#tag` and `[[#tag]]` become tags.
- Markdown links become references.
- Nested headings and links can create edges.
- `nodeHierarchy` and `relationParsing` control these structural conversions.

## Plain Text Import

- Blank-line blocks become nodes.
- Lines beginning with `- ` or `#tag:` become tags.
- Relations use the `A -> B: label` pattern when parsing is enabled.

## JSON Import

JSON import accepts ECHO-shaped graph data. Keep stable ids when updating existing graphs; `mergeById` is the default. Validate files from untrusted sources before import, since bad ids, cycles, or malformed timestamps can produce confusing graphs.

## Export Formats

- `json`
- `csv-nodes`
- `csv-edges`
- `markdown`
- `svg`
- `png`

## Export Scopes

- `all`
- `selected`
- `cluster`
- `filtered`

Scope is resolved against the active workspace graph before serialization or projection.

## SVG and PNG Caveats

SVG and PNG export use `projectGraph` from stored node positions. They are 2D projections of `x`/`z`, not screenshots of the live 3D canvas. Camera angle, starfield, lighting, and 3D depth are not preserved.

## Workspace and Snapshot Bundles

- Workspace bundles: `format: "echo-workspace"`, version `1`.
- Snapshot bundles: `format: "echo-snapshot"`, version `1`.

See `docs/workspaces-snapshots.md` and `docs/formats.md`.

## Local-Only Guarantees

- No file is uploaded.
- No conversion service is called.
- No AI-based parsing is used.
- All parsing and serialization run locally.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Unit tests cover importers, exporters, and utilities under `src/lib`.

See `docs/user-guide.md`, `docs/formats.md`, and `docs/persistence.md`.
