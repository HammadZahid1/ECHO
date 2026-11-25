import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders the hint with a tooltip role alongside its trigger', () => {
    render(<Tooltip label="Delete node"><button>Delete</button></Tooltip>);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete node');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('places the tooltip above the trigger by default', () => {
    const { container } = render(<Tooltip label="Hint"><button>Hover</button></Tooltip>);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip).toHaveClass('bottom-full');
    expect(tooltip).not.toHaveClass('top-full');
  });

  it('places the tooltip below the trigger when side is bottom', () => {
    const { container } = render(<Tooltip label="Hint" side="bottom"><button>Hover</button></Tooltip>);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip).toHaveClass('top-full');
    expect(tooltip).not.toHaveClass('bottom-full');
  });

  it('keeps the wrapped control interactive', () => {
    const onClick = vi.fn();
    render(<Tooltip label="Info"><button onClick={onClick}>Trigger</button></Tooltip>);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders independent hints for multiple tooltips', () => {
    render(<><Tooltip label="First hint"><button>One</button></Tooltip><Tooltip label="Second hint"><button>Two</button></Tooltip></>);
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips).toHaveLength(2);
    expect(tooltips[0]).toHaveTextContent('First hint');
    expect(tooltips[1]).toHaveTextContent('Second hint');
  });
});
