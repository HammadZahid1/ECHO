import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalHost } from '@/components/shell/ModalHost';
import { useUIStore } from '@/store/uiStore';

vi.mock('@/components/panels/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette">Command palette body</div>,
}));
vi.mock('@/components/panels/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="panel-settings">Settings body</div>,
}));
vi.mock('@/components/panels/SearchPanel', () => ({
  SearchPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="panel-search">
      Search body
      <button type="button" onClick={onClose}>Close search body</button>
    </div>
  ),
}));
vi.mock('@/components/panels/ImportPanel', () => ({
  ImportPanel: () => <div data-testid="panel-import">Import body</div>,
}));
vi.mock('@/components/panels/ExportPanel', () => ({
  ExportPanel: () => <div data-testid="panel-export">Export body</div>,
}));
vi.mock('@/components/panels/WorkspacePanel', () => ({
  WorkspacePanel: () => <div data-testid="panel-workspace">Workspace body</div>,
}));
vi.mock('@/components/panels/SnapshotsPanel', () => ({
  SnapshotsPanel: () => <div data-testid="panel-snapshot">Snapshots body</div>,
}));
vi.mock('@/components/panels/ComparePanel', () => ({
  ComparePanel: () => <div data-testid="panel-compare">Compare body</div>,
}));
vi.mock('@/components/panels/ShortcutsPanel', () => ({
  ShortcutsPanel: () => <div data-testid="panel-shortcuts">Shortcuts body</div>,
}));

describe('ModalHost', () => {
  beforeEach(() => {
    useUIStore.setState({
      modal: null,
      confirmMessage: '',
      confirmAction: null,
      searchOpen: false,
      commandPaletteOpen: false,
      contextMenu: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders no dialog when nothing is open but always mounts the command palette', () => {
    render(<ModalHost />);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the search dialog and closes it from the panel close callback', () => {
    act(() => useUIStore.setState({ searchOpen: true }));
    render(<ModalHost />);

    const dialog = screen.getByRole('dialog', { name: 'Search knowledge' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId('panel-search')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close search body' }));
    expect(useUIStore.getState().searchOpen).toBe(false);
    expect(screen.queryByRole('dialog', { name: 'Search knowledge' })).not.toBeInTheDocument();
  });

  it('closes the search dialog with Escape and with the header close button', () => {
    act(() => useUIStore.setState({ searchOpen: true }));
    render(<ModalHost />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useUIStore.getState().searchOpen).toBe(false);

    act(() => useUIStore.setState({ searchOpen: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(useUIStore.getState().searchOpen).toBe(false);
  });

  it('renders the settings dialog with its description and closes via Escape', () => {
    act(() => useUIStore.getState().openModal('settings'));
    render(<ModalHost />);

    const dialog = screen.getByRole('dialog', { name: 'ECHO settings' });
    expect(dialog).toHaveTextContent('Tune behavior, appearance, physics and accessibility. Stored on this device.');
    expect(screen.getByTestId('panel-settings')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useUIStore.getState().modal).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('maps each modal id to a titled dialog with the correct panel body', () => {
    const cases = [
      { id: 'import', title: 'Import knowledge', body: 'panel-import' },
      { id: 'export', title: 'Export knowledge', body: 'panel-export' },
      { id: 'shortcuts', title: 'Keyboard shortcuts', body: 'panel-shortcuts' },
      { id: 'snapshot', title: 'Snapshots', body: 'panel-snapshot' },
      { id: 'compare', title: 'Compare snapshots', body: 'panel-compare' },
      { id: 'workspace', title: 'Workspaces', body: 'panel-workspace' },
    ] as const;

    render(<ModalHost />);
    for (const { id, title, body } of cases) {
      act(() => useUIStore.getState().openModal(id));
      expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
      expect(screen.getByTestId(body)).toBeInTheDocument();
    }
  });

  it('does not open a generic dialog for onboarding', () => {
    act(() => useUIStore.getState().openModal('onboarding'));
    render(<ModalHost />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('runs the confirm action and closes the confirm dialog', () => {
    const confirmAction = vi.fn();
    act(() => useUIStore.getState().openModal('confirm', {
      confirmMessage: 'Replace the current universe?',
      confirmAction,
    }));
    render(<ModalHost />);

    const dialog = screen.getByRole('dialog', { name: 'Confirm action' });
    expect(dialog).toHaveTextContent('Replace the current universe?');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(confirmAction).toHaveBeenCalledTimes(1);
    expect(useUIStore.getState().modal).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels a confirmation without running its action', () => {
    const confirmAction = vi.fn();
    act(() => useUIStore.getState().openModal('confirm', {
      confirmMessage: 'Delete everything?',
      confirmAction,
    }));
    render(<ModalHost />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(confirmAction).not.toHaveBeenCalled();
    expect(useUIStore.getState().confirmAction).toBeNull();
    expect(useUIStore.getState().modal).toBeNull();
  });

  it('shows the default confirmation text when no message is supplied', () => {
    act(() => useUIStore.getState().openModal('confirm'));
    render(<ModalHost />);
    expect(screen.getByRole('dialog', { name: 'Confirm action' })).toHaveTextContent('Are you sure you want to continue?');
  });
});
