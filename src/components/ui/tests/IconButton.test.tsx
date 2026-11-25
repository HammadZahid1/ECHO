import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
  it('uses the label for both accessible name and tooltip, and renders children', () => {
    render(<IconButton label="Zoom in"><span data-testid="plus">+</span></IconButton>);
    const button = screen.getByRole('button', { name: 'Zoom in' });
    expect(button).toHaveAttribute('title', 'Zoom in');
    expect(button).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('plus')).toBeInTheDocument();
  });

  it('calls onClick with no arguments', () => {
    const onClick = vi.fn();
    render(<IconButton label="Reset" onClick={onClick}>↺</IconButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not activate while disabled', () => {
    const onClick = vi.fn();
    render(<IconButton label="Locked" disabled onClick={onClick}>🔒</IconButton>);
    const button = screen.getByRole('button', { name: 'Locked' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('distinguishes active from inactive styling', () => {
    const { rerender } = render(<IconButton label="Pan" active>✋</IconButton>);
    const button = screen.getByRole('button', { name: 'Pan' });
    expect(button).toHaveClass('bg-cyan-400/15');
    expect(button).toHaveClass('text-cyan-200');

    rerender(<IconButton label="Pan">✋</IconButton>);
    expect(button).not.toHaveClass('bg-cyan-400/15');
    expect(button).toHaveClass('text-zinc-500');
  });

  it('applies size-specific dimensions', () => {
    const { rerender } = render(<IconButton label="Sized">·</IconButton>);
    const button = screen.getByRole('button', { name: 'Sized' });
    expect(button).toHaveClass('h-8', 'w-8');
    rerender(<IconButton label="Sized" size="sm">·</IconButton>);
    expect(button).toHaveClass('h-7', 'w-7');
    rerender(<IconButton label="Sized" size="md">·</IconButton>);
    expect(button).toHaveClass('h-8', 'w-8');
  });

  it('forwards extra button attributes and custom classes', () => {
    render(<IconButton label="Star" className="my-button" aria-pressed="true" data-testid="star-button">★</IconButton>);
    const button = screen.getByTestId('star-button');
    expect(button).toHaveClass('my-button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-label', 'Star');
  });
});
