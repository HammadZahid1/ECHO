# Accessibility

ECHO aims to keep its graph interface usable with keyboard controls, readable visual modes, and reduced motion. All behavior is local; there is no backend, no AI API, no hosted model, no embedding service, and no external data service.

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

`highContrast` applies `echo-high-contrast` to the shell. It is intended to improve edge/text separation in dense graph views.

## Large Text

`largeText` applies `echo-large-text` to the shell. It scales interface typography without changing stored graph data.

## Screen Reader Graph Summary

- `screenReaderGraphSummary` exists as a preference.
- No consumer of this flag was observed in the current code.
- Do not assume a generated spoken graph summary is available.

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

## Graph Rendering Caveats

- 3D uses canvas/WebGL-style instanced rendering, so individual nodes are not automatically DOM controls.
- 2D uses Canvas 2D; node hit-testing is pointer-based.
- Table view is the most conventional DOM-oriented way to inspect nodes.
- No ARIA live graph summary implementation was observed.

## Inclusive Implementation Rules

- Keep keyboard shortcuts discoverable through the shortcuts modal.
- Preserve focus when toggling panels where possible.
- Do not remove focus outlines without an equivalent visible indicator.
- Keep motion settings respected by simulations, camera moves, and transitions.
- Do not claim screen reader graph summaries until a consumer is implemented.

## Verification

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Manual checks:

1. Toggle each accessibility setting in **Settings**.
2. Reload and confirm preference persistence.
3. Navigate with keyboard only through top bar, sidebar, graph, and right panel.
4. Verify `prefers-reduced-motion` with an OS/browser setting change.

See `docs/shortcuts.md`, `docs/user-guide.md`, and `docs/testing.md`.
