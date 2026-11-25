import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ECHO_PALETTE } from '@/lib/utils/color';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  it('exposes a colour input reflecting a valid value', () => {
    render(<ColorPicker value="#123456" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Custom color')).toHaveValue('#123456');
  });

  it('falls back to the ECHO cyan when the value is not a full hex colour', () => {
    const { rerender } = render(<ColorPicker value="rgb(1, 2, 3)" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Custom color')).toHaveValue('#4fd8e8');

    rerender(<ColorPicker value="#abc" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Custom color')).toHaveValue('#4fd8e8');
  });

  it('reports custom colour changes', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#123456" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Custom color'), { target: { value: '#abcdef' } });
    expect(onChange).toHaveBeenCalledWith('#abcdef');
  });

  it('renders a button for every palette colour', () => {
    render(<ColorPicker value="#000000" onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(ECHO_PALETTE.length);
    for (const color of ECHO_PALETTE) {
      expect(screen.getByRole('button', { name: `Use color ${color}` })).toHaveAttribute('title', color);
    }
  });

  it('reports the chosen palette colour', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: `Use color ${ECHO_PALETTE[1]}` }));
    expect(onChange).toHaveBeenCalledWith(ECHO_PALETTE[1]);
  });

  it('marks the active palette colour as selected', () => {
    render(<ColorPicker value={ECHO_PALETTE[0]} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: `Use color ${ECHO_PALETTE[0]}` })).toHaveClass('ring-1');
    expect(screen.getByRole('button', { name: `Use color ${ECHO_PALETTE[1]}` })).not.toHaveClass('ring-1');
  });

  it('can hide the palette while keeping the custom input', () => {
    render(<ColorPicker value="#123456" onChange={vi.fn()} includePalette={false} />);
    expect(screen.getByLabelText('Custom color')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
