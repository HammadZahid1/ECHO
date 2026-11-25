import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from '../Divider';

describe('Divider', () => {
  it('renders a single unlabelled rule when no label is supplied', () => {
    const { container } = render(<Divider />);
    expect(container.querySelectorAll('div')).toHaveLength(1);
    expect(container.textContent).toBe('');
  });

  it('renders the label between two rules when supplied', () => {
    const { container } = render(<Divider label="Connections" />);
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(container.querySelectorAll('div')).toHaveLength(3);
  });

  it('treats an empty label as unlabelled', () => {
    const { container } = render(<Divider label="" />);
    expect(container.querySelectorAll('div')).toHaveLength(1);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('reflects label changes on rerender', () => {
    const { rerender, container } = render(<Divider label="Before" />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    rerender(<Divider label="After" />);
    expect(screen.queryByText('Before')).not.toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(container.querySelectorAll('div')).toHaveLength(3);
  });
});
