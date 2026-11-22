# ECHO Data Formats

ECHO owns its data. These formats are documented so exports can be read elsewhere and imports can be authored by hand.

## JSON graph

```json
{
  "format": "echo-graph",
  "version": 1,
  "name": "Example universe",
  "nodes": [
    {
      "id": "node-1",
      "title": "Graph theory",
      "description": "The study of graphs.",
      "type": "concept",
      "tags": ["mathematics"],
      "importance": 0.8,
      "position": { "x": 0, "y": 0, "z": 0 },
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "related",
      "label": "relates to",
      "directed": false,
      "strength": 0.5,
      "createdAt": 1700000000000
    }
  ]
}
```

Unknown fields are preserved in imported metadata when possible. Missing IDs are generated. Edges referencing missing nodes are reported and skipped unless the import option `createMissingNodes` is enabled.

## CSV

Two sections are supported via a `kind` column or separate files:

- **nodes**: `id,title,description,type,tags,importance,color,source,x,y,z,createdAt,updatedAt`
- **edges**: `id,source,target,type,label,directed,strength,description,createdAt`

Tags use `|` as a delimiter. Column names are normalized (case and whitespace insensitive).

## Markdown

Each top-level heading starts a node. Paragraphs and lists become the node description. Inline links become `references` and `[[#tag]]` or `#tag` tokens become tags. Nested headings become child nodes with `contains` edges when that import option is enabled.

## Plain text

Blank-line-separated blocks become nodes. Lines beginning with `- ` become tags for the current block. `A -> B: label` becomes an edge when relation parsing is enabled.

## Exports

- **JSON** — full graph, selected nodes, clusters, or filtered graph.
- **CSV** — node and edge tables.
- **Markdown** — human-readable knowledge base with headings, descriptions, tags, and relationship lists.
- **SVG** — 2D projection of the current graph.
- **PNG** — rasterized canvas capture of the 2D projection.

Snapshots embed the complete graph plus metadata and can be re-imported.
