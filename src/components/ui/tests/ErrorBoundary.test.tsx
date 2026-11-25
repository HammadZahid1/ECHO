import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

let shouldThrow = true;

function Fragile({ content = 'Healthy content' }: { content?: string }) {
  if (shouldThrow) throw new Error('render exploded');
  return <p>{content}</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children normally while no error occurs', () => {
    shouldThrow = false;
    render(<ErrorBoundary><Fragile /></ErrorBoundary>);
    expect(screen.getByText('Healthy content')).toBeInTheDocument();
    expect(screen.queryByText('Rendering error')).not.toBeInTheDocument();
  });

  it('shows the default fallback instead of the failing children', () => {
    render(<ErrorBoundary><Fragile /></ErrorBoundary>);
    expect(screen.getByText('Rendering error')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The universe could not be rendered' })).toBeInTheDocument();
    expect(screen.queryByText('Healthy content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('uses a custom title and reports the caught error', () => {
    render(<ErrorBoundary fallbackTitle="Graph unavailable"><Fragile /></ErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'Graph unavailable' })).toBeInTheDocument();
    const errorCall = vi.mocked(console.error).mock.calls.find((call) => call[0] === 'ECHO encountered a rendering error');
    expect(errorCall).toBeDefined();
    expect(errorCall?.[1]).toBeInstanceOf(Error);
    expect((errorCall?.[1] as Error).message).toBe('render exploded');
    expect(errorCall?.[2]).toEqual(expect.any(String));
  });

  it('recovers and renders children after Try again once the problem is fixed', () => {
    render(<ErrorBoundary><Fragile content="Recovered graph" /></ErrorBoundary>);
    expect(screen.queryByText('Recovered graph')).not.toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered graph')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('returns to the fallback when the child still throws on retry', () => {
    render(<ErrorBoundary><Fragile /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Rendering error')).toBeInTheDocument();
    expect(screen.queryByText('Healthy content')).not.toBeInTheDocument();
  });
});
