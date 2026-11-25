import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastHost } from '../ToastHost';

type TestToast = {
  id: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  createdAt: number;
  duration: number;
};

const store = vi.hoisted(() => ({
  toasts: [] as TestToast[],
  dismissToast: vi.fn(),
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { toasts: TestToast[]; dismissToast: typeof store.dismissToast }) => unknown) =>
    selector({ toasts: store.toasts, dismissToast: store.dismissToast }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, role, className }: { children?: ReactNode; role?: string; className?: string }) => (
      <div role={role} className={className}>{children}</div>
    ),
  },
}));

const makeToast = (overrides: Partial<TestToast> = {}): TestToast => ({
  id: 'toast-1',
  kind: 'info',
  title: 'Saved',
  detail: 'Graph written locally',
  createdAt: 0,
  duration: 5000,
  ...overrides,
});

describe('ToastHost', () => {
  beforeEach(() => {
    store.toasts = [];
    store.dismissToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders no notifications when the store is empty', () => {
    const { container } = render(<ToastHost />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    expect(container).toHaveTextContent('');
  });

  it('shows the title and detail of a toast', () => {
    store.toasts = [makeToast()];
    render(<ToastHost />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved');
    expect(status).toHaveTextContent('Graph written locally');
  });

  it('dismisses a toast from its button', () => {
    store.toasts = [makeToast({ id: 'toast-a' })];
    render(<ToastHost />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(store.dismissToast).toHaveBeenCalledTimes(1);
    expect(store.dismissToast).toHaveBeenCalledWith('toast-a');
  });

  it('dismisses a toast automatically after its duration', () => {
    vi.useFakeTimers();
    store.toasts = [makeToast({ id: 'toast-auto', duration: 500 })];
    render(<ToastHost />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(store.dismissToast).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(store.dismissToast).toHaveBeenCalledWith('toast-auto');
  });

  it('renders multiple toasts and dismisses only the clicked one', () => {
    store.toasts = [
      makeToast({ id: 'a', title: 'First' }),
      makeToast({ id: 'b', title: 'Second' }),
    ];
    render(<ToastHost />);
    const buttons = screen.getAllByRole('button', { name: 'Dismiss notification' });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(store.dismissToast).toHaveBeenCalledTimes(1);
    expect(store.dismissToast).toHaveBeenCalledWith('b');
  });

  it('renders an icon for each toast kind', () => {
    store.toasts = (['info', 'success', 'warning', 'error'] as const).map((kind, index) =>
      makeToast({ id: `kind-${index}`, kind, title: `Message ${kind}` }),
    );
    render(<ToastHost />);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(4);
    for (const status of statuses) {
      expect(status.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('omits the detail paragraph when there is no detail', () => {
    store.toasts = [makeToast({ detail: undefined })];
    render(<ToastHost />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.queryByText('Graph written locally')).not.toBeInTheDocument();
  });
});
