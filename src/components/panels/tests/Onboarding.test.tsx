import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Onboarding } from '@/components/panels/Onboarding';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined };
});

function renderOnboarding(options: { showOnboarding?: boolean; onboardingComplete?: boolean; modal?: 'onboarding' | null } = {}): void {
  const { showOnboarding = false, onboardingComplete = true, modal = null } = options;
  useSettingsStore.setState({ showOnboarding, onboardingComplete });
  useUIStore.setState({ modal, confirmAction: null, confirmMessage: '', toasts: [] });
  render(<Onboarding />);
}

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stays hidden when the tour has been completed', () => {
    renderOnboarding();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens automatically for a first-time user', () => {
    renderOnboarding({ showOnboarding: true, onboardingComplete: false });
    expect(screen.getByRole('dialog', { name: 'Welcome to ECHO · 1 of 4' })).toBeInTheDocument();
    expect(screen.getByText('Your local-first knowledge universe. Everything you create stays in this browser — nothing is uploaded.')).toBeInTheDocument();
    expect(screen.getByText('Changes auto-save locally as you work.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('advances step by step and supports going back', () => {
    renderOnboarding({ showOnboarding: true, onboardingComplete: false });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Build your graph · 2 of 4' })).toBeInTheDocument();
    expect(screen.getByText(/Press N to create a node/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('dialog', { name: 'Welcome to ECHO · 1 of 4' })).toBeInTheDocument();
  });

  it('jumps directly to a step using the progress dots', () => {
    renderOnboarding({ showOnboarding: true, onboardingComplete: false });
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 4' }));
    expect(screen.getByRole('dialog', { name: 'Capture & share · 4 of 4' })).toBeInTheDocument();
    expect(screen.getByText(/Snapshots mark moments in time/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start exploring' })).toBeInTheDocument();
  });

  it('completes the tour when the user skips it', () => {
    renderOnboarding({ showOnboarding: true, onboardingComplete: false });
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    expect(useSettingsStore.getState().showOnboarding).toBe(false);
    expect(useUIStore.getState().modal).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('finishes from the last step and restarts at step one when reopened', () => {
    renderOnboarding({ showOnboarding: true, onboardingComplete: false });
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start exploring' }));
    expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => { useUIStore.setState({ modal: 'onboarding' }); });
    expect(screen.getByRole('dialog', { name: 'Welcome to ECHO · 1 of 4' })).toBeInTheDocument();
  });
});
