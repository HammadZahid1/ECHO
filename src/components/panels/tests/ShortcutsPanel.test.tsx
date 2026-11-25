import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ShortcutsPanel } from '@/components/panels/ShortcutsPanel';

function rowFor(label: string): HTMLElement {
  const cell = screen.getByText(label);
  const row = cell.closest('tr');
  if (!row) throw new Error(`No table row found for ${label}`);
  return row;
}

describe('ShortcutsPanel', () => {
  it('renders the panel title and subtitle', () => {
    render(<ShortcutsPanel />);
    expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.getByText('Work at the speed of thought')).toBeInTheDocument();
  });

  it('groups shortcuts into three tables with action and key columns', () => {
    render(<ShortcutsPanel />);
    expect(screen.getAllByRole('table')).toHaveLength(3);
    expect(screen.getAllByRole('columnheader', { name: 'Action' })).toHaveLength(3);
    expect(screen.getAllByRole('columnheader', { name: 'Keys' })).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(14); // three headers plus eleven shortcuts
  });

  it('shows the general shortcuts with their key caps', () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText('General')).toBeInTheDocument();
    const row = within(rowFor('Open command palette'));
    expect(row.getByText('Ctrl')).toBeInTheDocument();
    expect(row.getByText('K')).toBeInTheDocument();
    expect(within(rowFor('Show keyboard shortcuts')).getByText('?')).toBeInTheDocument();
  });

  it('lists the editing shortcuts including long key combinations', () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByText('Create a new node')).toBeInTheDocument();
    expect(within(rowFor('Undo last change')).getByText('Z')).toBeInTheDocument();
    const redo = within(rowFor('Redo last change'));
    expect(redo.getByText('Ctrl')).toBeInTheDocument();
    expect(redo.getByText('Shift')).toBeInTheDocument();
    expect(redo.getByText('Z')).toBeInTheDocument();
    expect(screen.getByText('Redo (alternative)')).toBeInTheDocument();
  });

  it('lists the navigation shortcuts', () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(within(rowFor('Focus the selected node')).getByText('F')).toBeInTheDocument();
    expect(within(rowFor('Toggle connection mode')).getByText('G')).toBeInTheDocument();
    expect(within(rowFor('Toggle the inspector panel')).getByText('H')).toBeInTheDocument();
  });

  it('explains platform differences and text-field behavior', () => {
    render(<ShortcutsPanel />);
    expect(screen.getByText(/On macOS, use ⌘ in place of Ctrl/)).toBeInTheDocument();
    expect(screen.getByText(/ignored while typing in a text field/)).toBeInTheDocument();
  });
});
