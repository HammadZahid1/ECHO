import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../Modal';

type ModalProps = ComponentProps<typeof Modal>;

const baseProps = (overrides: Partial<ModalProps> = {}): ModalProps => ({
  open: true,
  title: 'Settings',
  onClose: vi.fn(),
  children: <p>Modal body</p>,
  ...overrides,
});

describe('Modal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<Modal {...baseProps({ open: false })} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the title, description, children and footer in a modal dialog', () => {
    render(<Modal {...baseProps({ description: 'Adjust your workspace', footer: <button>Done</button> })} />);
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Adjust your workspace')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('closes from the header close button', () => {
    const onClose = vi.fn();
    render(<Modal {...baseProps({ onClose })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Modal {...baseProps({ onClose })} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes only when the backdrop itself is pressed', () => {
    const onClose = vi.fn();
    const { container } = render(<Modal {...baseProps({ onClose })} />);
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('focuses the dialog on open and restores the previous focus on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    try {
      const { rerender } = render(<Modal {...baseProps({ onClose })} />);
      expect(screen.getByRole('dialog')).toHaveFocus();
      rerender(<Modal {...baseProps({ open: false, onClose })} />);
      expect(trigger).toHaveFocus();
    } finally {
      trigger.remove();
    }
  });

  it('wraps focus between the first and last focusable elements', () => {
    render(<Modal {...baseProps({ children: <button>Save</button> })} />);
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const save = screen.getByRole('button', { name: 'Save' });

    save.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();
  });

  it('honours a custom width', () => {
    render(<Modal {...baseProps({ width: 'max-w-sm' })} />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
  });
});
