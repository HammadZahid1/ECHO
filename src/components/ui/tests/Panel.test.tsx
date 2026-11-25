import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from '../Panel';

describe('Panel', () => {
  it('renders the title, subtitle and body', () => {
    render(<Panel title="Nodes" subtitle="12 in graph"><p>Body content</p></Panel>);
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('12 in graph')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders actions alongside the heading', () => {
    render(<Panel title="Nodes" actions={<button>Add node</button>}><p>Body</p></Panel>);
    expect(screen.getByRole('button', { name: 'Add node' })).toBeInTheDocument();
  });

  it('toggles body visibility with a labelled collapse control', () => {
    render(<Panel title="Nodes" collapsible><p>Body content</p></Panel>);
    const toggle = screen.getByRole('button', { name: 'Collapse Nodes' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body content')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('Body content')).not.toBeInTheDocument();
    const expand = screen.getByRole('button', { name: 'Expand Nodes' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expand);
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Nodes' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts collapsed when defaultCollapsed is set', () => {
    render(<Panel title="Edges" collapsible defaultCollapsed><p>Edge list</p></Panel>);
    expect(screen.queryByText('Edge list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Edges' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no collapse control when not collapsible', () => {
    render(<Panel title="Stats"><p>Statistics</p></Panel>);
    expect(screen.queryByRole('button', { name: /Edges|Collapse|Expand/ })).not.toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('applies custom section and body classes', () => {
    const { container } = render(<Panel title="Notes" className="panel-extra" bodyClassName="body-extra"><p>Note</p></Panel>);
    expect(container.querySelector('section')).toHaveClass('echo-panel', 'panel-extra');
    expect(screen.getByText('Note').parentElement).toHaveClass('body-extra');
  });

  it('keeps the collapse state when the title changes', () => {
    const { rerender } = render(<Panel title="Before" collapsible><p>Body</p></Panel>);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Before' }));
    expect(screen.queryByText('Body')).not.toBeInTheDocument();

    rerender(<Panel title="After" collapsible><p>Body</p></Panel>);
    expect(screen.getByRole('button', { name: 'Expand After' })).toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });
});
