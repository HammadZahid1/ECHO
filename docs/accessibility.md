# Accessibility

ECHO aims to keep its graph interface usable with keyboard controls, readable visual modes, and reduced motion. All behavior is local; there is no backend, AI API, hosted model, embedding service, or external data service.

## Accessibility Settings

Settings expose:

- `reduceMotion`
- `highContrast`
- `largeText`
- `screenReaderGraphSummary`

`AppShell` applies these classes:

- `echo-high-contrast`
- `echo-large-text`
- `echo-reduce-motion`

## Reduced Motion

- `useReducedMotion` checks the `reduceMotion` setting.
- It also checks the operating system `prefers-reduced-motion` media query.
- Reduced motion affects simulation/animation behavior and visual transitions.

## High Contrast

`highContrast` applies `echo-high-contrast` to the shell. It improves edge/text separation in dense graph views.

## Large Text

`largeText` applies `echo-large-text` to the shell. It scales interface typography without changing stored graph data.

## Screen Reader Graph Summary

When `screenReaderGraphSummary` is enabled, `GraphViewport` renders a visually hidden live region describing:

- node and relationship counts
- cluster and isolated-node counts
- number of selected nodes
- up to three most-connected node titles

The summary updates from the same filtered graph data used by the active view. It is a structural summary, not a full reading of every node or relationship.

## Keyboard Access

Global shortcuts are listed in `docs/shortcuts.md`:

- `Ctrl/Cmd+K` command palette
- `Escape` closes modal/menu
- `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y` history
- `Delete` / `Backspace` delete selection
- `F` focus first selected node
- `N` new node
- `G` toggle select/connect
- `H` toggle inspector
- `?` / `Shift+/` shortcuts help

Most shortcuts are suppressed in text inputs, textareas, and contenteditable elements.

Menus focus their first item when opened, support Escape, and close on outside pointer press. Dialogs expose accessible titles and close controls. Toasts use a polite live region.

## Graph Rendering Caveats

- The 3D universe uses WebGL canvas rendering, so individual nodes are not automatically DOM controls.
- The 2D graph uses Canvas 2D; node hit-testing is pointer-based.
- Table view is the most conventional DOM-oriented way to inspect nodes.
- The live graph summary provides structure, but it does not replace a full screen reader audit.

## Inclusive Implementation Rules

- Keep keyboard shortcuts discoverable through the shortcuts modal.
- Preserve focus when toggling panels where possible.
- Do not remove focus outlines without an equivalent visible indicator.
- Keep motion settings respected by simulations, camera moves, and transitions.
- Do not claim feature parity between canvas renderers and DOM views.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Automated checks cover labelled controls, keyboard creation/undo, context menu opening and dismissal, settings persistence, and the screen-reader summary component. Real screen reader verification remains manual.

Manual checks:

1. Toggle each accessibility setting in **Settings**.
2. Reload and confirm preference persistence.
3. Navigate with keyboard only through top bar, sidebar, graph, and right panel.
4. Verify `prefers-reduced-motion` with an OS/browser setting change.
5. Use a screen reader with the graph summary enabled and disabled.

See `docs/shortcuts.md`, `docs/user-guide.md`, and `docs/testing.md`.
