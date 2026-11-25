import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastHost } from '@/components/shell/ToastHost';
import { useUIStore } from '@/store/uiStore';
import type { ToastMessage } from '@/types';

type ToastInput = Omit<ToastMessage, 'id' | 'createdAt' | 'duration'> & { duration?: number };

function toast(overrides: Partial<ToastInput> = {}) {
  useUIStore.getState().pushToast({
    kind: 'info',
    title: 'Notice',
    detail: 'Some detail',
    duration: 50_000,
    ...overrides,
  });
}

describe('ToastHost', () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing when the toast queue is empty', () => {
    const { container } = render(<ToastHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders every toast kind with its title and detail in a live region', () => {
    act(() => {
      toast({ kind: 'info', title: 'Info title', detail: 'Info detail' });
      toast({ kind: 'success', title: 'Success title', detail: 'Success detail' });
      toast({ kind: 'warning', title: 'Warning title' });
      toast({ kind: 'error', title: 'Error title', detail: 'Error detail' });
    });
    const { container } = render(<ToastHost />);

    expect(screen.getAllByRole('status')).toHaveLength(4);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    expect(screen.getByText('Info title')).toBeInTheDocument();
    expect(screen.getByText('Success detail')).toBeInTheDocument();
    expect(screen.getByText('Warning title')).toBeInTheDocument();
    expect(screen.getByText('Error detail')).toBeInTheDocument();
    expect(screen.getByText('Info title').closest('[role="status"]')).toHaveClass('echo-toast');
  });

  it('dismisses only the selected toast', () => {
    act(() => {
      toast({ title: 'First title' });
      toast({ title: 'Second title' });
    });
    render(<ToastHost />);

    const first = screen.getByText('First title').closest('[role="status"]') as HTMLElement;
    fireEvent.click(within(first).getByRole('button', { name: 'Dismiss notification' }));

    expect(useUIStore.getState().toasts.map((item) => item.title)).toEqual(['Second title']);
    expect(screen.queryByText('First title')).not.toBeInTheDocument();
    expect(screen.getByText('Second title')).toBeInTheDocument();
  });

  it('automatically dismisses toasts when their duration elapses', () => {
    vi.useFakeTimers();
    act(() => {
      toast({ title: 'Short lived', duration: 1000 });
      toast({ title: 'Long lived', duration: 5000 });
    });
    render(<ToastHost />);

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('Short lived')).not.toBeInTheDocument();
    expect(screen.getByText('Long lived')).toBeInTheDocument();

    // Dismissing one toast must not reset the remaining toast's deadline.
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText('Long lived')).not.toBeInTheDocument();
    expect(useUIStore.getState().toasts).toEqual([]);
  });

  it('clears pending dismissal timers on unmount', () => {
    vi.useFakeTimers();
    const dismiss = vi.spyOn(useUIStore.getState(), 'dismissToast');
    act(() => toast({ title: 'Pending', duration: 1000 }));
    const { unmount } = render(<ToastHost />);

    unmount();
    act(() => vi.advanceTimersByTime(5000));

    expect(dismiss).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts).toHaveLength(1);
  });
});
