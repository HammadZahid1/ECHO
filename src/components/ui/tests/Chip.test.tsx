import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { colorForString, hexToRgb, readableTextColor } from '@/lib/utils/color';
import { Chip } from '../Chip';

const rgbStyle = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
};

describe('Chip', () => {
  it('renders the label with a deterministic default color dot and no selection handler', () => {
    const { container } = render(<Chip label="Research" />);
    const labelButton = screen.getByRole('button', { name: 'Research' });
    expect(labelButton).toBeDisabled();
    expect(container.querySelector('span[style]')).toHaveStyle({
      background: rgbStyle(colorForString('Research')),
    });
  });

  it('uses an explicit color for the dot instead of the derived one', () => {
    const { container } = render(<Chip label="Pinned" color="#123456" />);
    expect(container.querySelector('span[style]')).toHaveStyle({ background: 'rgb(18, 52, 86)' });
  });

  it('renders a count when provided, including zero', () => {
    const { rerender } = render(<Chip label="Nodes" count={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    rerender(<Chip label="Nodes" count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    rerender(<Chip label="Nodes" />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onSelect from the label button only when a handler exists', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<Chip label="Topic" onSelect={onSelect} />);
    const labelButton = screen.getByRole('button', { name: 'Topic' });
    expect(labelButton).toBeEnabled();
    fireEvent.click(labelButton);
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(<Chip label="Topic" />);
    const inertButton = screen.getByRole('button', { name: 'Topic' });
    expect(inertButton).toBeDisabled();
    fireEvent.click(inertButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows a labelled remove button and calls onRemove', () => {
    const onRemove = vi.fn();
    const { rerender } = render(<Chip label="Draft" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Draft' }));
    expect(onRemove).toHaveBeenCalledTimes(1);

    rerender(<Chip label="Draft" />);
    expect(screen.queryByRole('button', { name: 'Remove Draft' })).not.toBeInTheDocument();
  });

  it('replaces the default dot with a custom icon', () => {
    const { container } = render(<Chip label="Flagged" icon={<span data-testid="flag">⚑</span>} />);
    expect(screen.getByTestId('flag')).toBeInTheDocument();
    expect(container.querySelector('span[style]')).not.toBeInTheDocument();
  });

  it('applies the accent border and readable text color when selected', () => {
    const { container } = render(<Chip label="Active" color="#4fd8e8" selected />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveStyle({ borderColor: 'rgba(79, 216, 232, 0.6)' });
    expect(outer).toHaveStyle({ color: rgbStyle(readableTextColor('#111418')) });
  });
});
