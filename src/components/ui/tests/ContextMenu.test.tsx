import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ContextMenuState } from '@/types';
import { ContextMenu, type MenuItem } from '../ContextMenu';

const state: ContextMenuState = { x: 120, y: 80, target: 'node', targetId: 'node-1' };

const makeItems = (): MenuItem[] => [
  { id: 'rename', label: 'Rename', shortcut: 'F2', onSelect: vi.fn() },
  { id: 'duplicate', label: 'Duplicate', onSelect: vi.fn() },
  { id: 'delete', label: 'Delete', danger: true, disabled: true, onSelect: vi.fn() },
];

describe('ContextMenu', () => {
  it('renders a labelled menu and an optional heading', () => {
    const { rerender } = render(<ContextMenu state={state} items={makeItems()} onClose={vi.fn()} />);
    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument();
    expect(screen.queryByText('Node actions')).not.toBeInTheDocument();

    rerender(<ContextMenu state={state} items={makeItems()} onClose={vi.fn()} title="Node actions" />);
    expect(screen.getByRole('menu', { name: 'Node actions' })).toBeInTheDocument();
    expect(screen.getByText('Node actions')).toBeInTheDocument();
  });

  it('renders each item with its label and shortcut', () => {
    render(<ContextMenu state={state} items={makeItems()} onClose={vi.fn()} />);
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: /Rename/ })).toHaveTextContent('F2');
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeDisabled();
  });

  it('runs the action and closes the menu when an enabled item is clicked', () => {
    const items = makeItems();
    const onClose = vi.fn();
    render(<ContextMenu state={state} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Rename/ }));
    expect(items[0].onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks on disabled items', () => {
    const items = makeItems();
    const onClose = vi.fn();
    render(<ContextMenu state={state} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));
    expect(items[2].onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape and on a pointer press outside the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu state={state} items={makeItems()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('focuses the first item when opened', () => {
    render(<ContextMenu state={state} items={makeItems()} onClose={vi.fn()} />);
    expect(screen.getByRole('menuitem', { name: /Rename/ })).toHaveFocus();
  });

  it('positions at the requested point and clamps to the viewport', () => {
    const { rerender } = render(<ContextMenu state={state} items={makeItems()} onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '120px', top: '80px' });

    rerender(<ContextMenu state={{ ...state, x: 99999, y: 99999 }} items={makeItems()} onClose={vi.fn()} />);
    expect(menu).toHaveStyle({ left: `${window.innerWidth - 220}px` });
    expect(menu).toHaveStyle({ top: `${window.innerHeight - 3 * 34 - 40}px` });

    rerender(<ContextMenu state={{ ...state, x: -50, y: -50 }} items={makeItems()} onClose={vi.fn()} />);
    expect(menu).toHaveStyle({ left: '0px', top: '0px' });
  });
});
