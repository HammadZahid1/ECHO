# Keyboard Shortcuts

Shortcuts are registered in `src/hooks/useKeyboardShortcuts.ts`. They are global window shortcuts unless noted.

ECHO has no backend, no AI APIs, no hosted model, and no external data services. Shortcuts only mutate local UI state or the active browser-local workspace; graph effects come from deterministic local algorithms and browser-local persistence.

## Typing Guard

Most shortcuts are ignored while focus is in `INPUT`, `TEXTAREA`, or a `contenteditable` element. Two exceptions always run:

- `Ctrl/Cmd+K`
- `Escape`

This lets dialogs and editors capture ordinary letters without triggering global view changes.

## Global Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd+K` | Open the command palette. |
| `Escape` | Close the topmost modal or context menu. |
| `Ctrl/Cmd+Z` | Undo the last graph history entry. |
| `Ctrl/Cmd+Shift+Z` | Redo. |
| `Ctrl/Cmd+Y` | Redo. |
| `Delete` / `Backspace` | Delete the current selection. |
| `F` | Focus the first selected node. |
| `N` | Create a node titled `New concept`. |
| `G` | Toggle graph mode between `select` and `connect`. |
| `H` | Toggle the inspector / right panel. |
| `?` or `Shift+/` | Open the shortcuts modal. |

`Ctrl/Cmd` means `Control` on Windows/Linux and `Meta` on macOS.

## Modal Behaviors

- The command palette ID is `shortcuts` for the help modal and is opened by `?` / `Shift+/`.
- `Escape` closes modals and context menus in the shell.
- The right panel toggle (`H`) affects the inspector side of `AppShell`.

## Shortcut Contexts

- `Delete` / `Backspace` operate on selected graph elements, not arbitrary text fields.
- `G` changes how pointer input is interpreted by the graph canvas.
- `F` calls the viewport focus behavior for the first selected node.
- `N` creates a node in the active workspace and records an undoable history entry.

## Discovery in the UI

- A help entry exists for the shortcuts modal.
- The command palette supports local fuzzy subsequence matching over commands and up to five quick node results.
- There is no visual keyboard-chord display beyond the shortcuts modal.

## Conflict Handling

- The first matching handler wins; keep bindings unique.
- `Escape` is modal/menu scoped and should not also mutate graph data.
- `Ctrl/Cmd+K` opens the palette even when a text field has focus.
- Plain-letter shortcuts require no text field focus.
- Undo/redo always operate on the active workspace history, never on a different workspace.

## Implementation Notes

- The hook listens on `window`, so mounted panels do not need their own key listeners.
- Graph actions use store actions rather than calling algorithms directly.
- `N` creates `New concept` in the active workspace and adds a history entry.
- `G` changes graph input mode from `select` to `connect` and back.
- `F` is a no-op when no node is selected.
- `Delete` / `Backspace` are no-ops when nothing is selected.
- `H` toggles the inspector side of `AppShell`.

## Conventions

- Shortcuts are defined once in `useKeyboardShortcuts.ts`; do not duplicate handlers in individual panels.
- New shortcuts should respect the input/contenteditable guard unless they are intentionally modal-level escapes.
- Shortcut help must be updated when new bindings are added.
- Do not bind a shortcut that conflicts with browser-level navigation without a strong reason.

## Verification

- Run `npm run typecheck` after changing the hook.
- Run `npm run lint` after changing the hook.
- Start with `npm run dev` and manually verify each binding in:
  - empty canvas
  - selected node
  - active text input
  - open modal

See `docs/user-guide.md` for the surrounding UI flow and `docs/testing.md` for test commands.
