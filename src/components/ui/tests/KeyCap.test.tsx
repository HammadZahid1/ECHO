import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyCap } from '../KeyCap';

describe('KeyCap', () => {
  it('renders its text inside a keyboard element', () => {
    const { container } = render(<KeyCap>Esc</KeyCap>);
    const kbd = container.querySelector('kbd');
    expect(kbd).toBeInTheDocument();
    expect(kbd).toHaveTextContent('Esc');
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('renders several key caps as separate elements for a shortcut', () => {
    const { container } = render(<><KeyCap>Ctrl</KeyCap><KeyCap>K</KeyCap></>);
    expect(container.querySelectorAll('kbd')).toHaveLength(2);
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('accepts arbitrary React nodes as children', () => {
    render(<KeyCap><span data-testid="arrow">↑</span> Arrow</KeyCap>);
    expect(screen.getByTestId('arrow')).toBeInTheDocument();
    expect(screen.getByText(/Arrow/)).toBeInTheDocument();
  });

  it('renders an empty keyboard element for empty children', () => {
    const { container } = render(<KeyCap>{null}</KeyCap>);
    expect(container.querySelector('kbd')).toBeEmptyDOMElement();
  });
});
