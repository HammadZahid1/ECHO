import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState, ErrorState, LoadingState, StatTile } from '../states';

describe('states', () => {
  describe('EmptyState', () => {
    it('shows the title, description and an action', () => {
      render(<EmptyState title="No nodes" description="Add a node to begin" action={<button>Create node</button>} />);
      expect(screen.getByText('No nodes')).toBeInTheDocument();
      expect(screen.getByText('Add a node to begin')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create node' })).toBeInTheDocument();
    });

    it('renders the default icon and allows it to be replaced', () => {
      const { container, rerender } = render(<EmptyState title="Nothing here" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.queryByText('Add a node to begin')).not.toBeInTheDocument();

      rerender(<EmptyState title="Nothing here" icon={<span data-testid="custom-icon">✦</span>} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(container.querySelectorAll('svg')).toHaveLength(0);
    });
  });

  describe('LoadingState', () => {
    it('exposes a status region with the default label', () => {
      render(<LoadingState />);
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Processing…');
      expect(status.querySelector('svg')).toBeInTheDocument();
    });

    it('renders a custom label', () => {
      render(<LoadingState label="Laying out graph…" />);
      expect(screen.getByRole('status')).toHaveTextContent('Laying out graph…');
      expect(screen.queryByText('Processing…')).not.toBeInTheDocument();
    });
  });

  describe('ErrorState', () => {
    it('exposes an alert with the title, description and action', () => {
      render(<ErrorState title="Import failed" description="The file is unreadable" action={<button>Retry</button>} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Import failed');
      expect(alert).toHaveTextContent('The file is unreadable');
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('renders only the title when no description or action is given', () => {
      render(<ErrorState title="Offline" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Offline');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('StatTile', () => {
    it('shows the label, value and hint', () => {
      render(<StatTile label="Nodes" value={42} hint="across 3 clusters" />);
      expect(screen.getByText('Nodes')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('across 3 clusters')).toBeInTheDocument();
    });

    it('uses the default value color and an accent when provided', () => {
      const { rerender } = render(<StatTile label="Edges" value="120" />);
      const value = screen.getByText('120');
      expect(value).toHaveStyle({ color: 'rgb(231, 233, 236)' });

      rerender(<StatTile label="Edges" value="120" accent="#ff6b6b" />);
      expect(screen.getByText('120')).toHaveStyle({ color: 'rgb(255, 107, 107)' });
      expect(screen.queryByText('across 3 clusters')).not.toBeInTheDocument();
    });
  });
});
