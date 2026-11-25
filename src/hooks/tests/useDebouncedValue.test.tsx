import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('returns the initial value immediately without waiting for the timer', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 200));

    expect(result.current).toBe('initial');
    act(() => { vi.advanceTimersByTime(199); });
    expect(result.current).toBe('initial');
  });

  it('adopts the new value after the configured delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    expect(result.current).toBe('first');

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('second');
  });

  it('cancels superseded updates and keeps only the latest rapid value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 0 },
    });

    rerender({ value: 1 });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: 2 });
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current).toBe(0);

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe(2);
  });

  it('honours a changed delay on rerender', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'a', delay: 500 } },
    );

    rerender({ value: 'b', delay: 50 });
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current).toBe('b');
  });

  it('does not update after unmount', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 'start' },
    });

    rerender({ value: 'never-shown' });
    unmount();

    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('start');
  });
});
