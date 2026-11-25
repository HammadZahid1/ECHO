import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from '../SegmentedControl';

const options = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid', title: 'Grid view' },
  { value: 'graph', label: 'Graph' },
];

describe('SegmentedControl', () => {
  it('renders a labelled tab list with one tab per option', () => {
    render(<SegmentedControl options={options} value="list" onChange={vi.fn()} label="View mode" />);
    expect(screen.getByRole('tablist', { name: 'View mode' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(options.length);
    for (const option of options) {
      expect(screen.getByRole('tab', { name: option.label })).toBeInTheDocument();
    }
  });

  it('marks only the current value as selected', () => {
    render(<SegmentedControl options={options} value="grid" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Grid' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the value of the clicked option', () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="list" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Graph' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('graph');
  });

  it('reflects a new selected value on rerender', () => {
    const { rerender } = render(<SegmentedControl options={options} value="list" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true');
    rerender(<SegmentedControl options={options} value="graph" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');
  });

  it('uses the option title when provided and falls back to its label', () => {
    render(<SegmentedControl options={options} value="list" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Grid' })).toHaveAttribute('title', 'Grid view');
    expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('title', 'List');
  });

  it('accepts a custom class on the tab list', () => {
    render(<SegmentedControl options={options} value="list" onChange={vi.fn()} className="my-tabs" />);
    expect(screen.getByRole('tablist')).toHaveClass('my-tabs');
  });
});
