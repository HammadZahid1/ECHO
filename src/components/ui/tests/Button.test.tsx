import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children and an optional leading icon', () => {
    render(<Button icon={<span data-testid="leading-icon">★</span>}>Save graph</Button>);
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save graph/ })).toBeInTheDocument();
  });

  it('uses type="button" by default but forwards an explicit type', () => {
    const { rerender } = render(<Button>Default</Button>);
    expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('type', 'button');

    rerender(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when activated', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick while disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Unavailable</Button>);
    const button = screen.getByRole('button', { name: 'Unavailable' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards className, title and aria attributes', () => {
    render(<Button className="my-extra" title="Add a node" aria-label="Add node">+</Button>);
    const button = screen.getByRole('button', { name: 'Add node' });
    expect(button).toHaveClass('my-extra');
    expect(button).toHaveAttribute('title', 'Add a node');
  });

  it('applies distinct sizing classes for sm and md', () => {
    const { container } = render(<><Button size="sm">Small</Button><Button size="md">Medium</Button></>);
    const [small, medium] = Array.from(container.querySelectorAll('button'));
    expect(small).toHaveClass('h-7');
    expect(medium).toHaveClass('h-8');
  });
});
