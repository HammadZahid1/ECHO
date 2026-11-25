import { fireEvent, render, screen } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Select, Slider, TextArea, TextField, Toggle } from '../controls';

describe('controls', () => {
  describe('TextField', () => {
    it('associates the label with the input and forwards input attributes', () => {
      render(<TextField label="Node name" placeholder="Untitled" defaultValue="Alpha" />);
      const input = screen.getByLabelText('Node name');
      expect(input).toHaveAttribute('placeholder', 'Untitled');
      expect(input).toHaveValue('Alpha');
    });

    it('reports edits through onChange and accepts a custom class', () => {
      const onChange = vi.fn();
      render(<TextField label="Search" className="my-field" onChange={onChange} />);
      const input = screen.getByLabelText('Search');
      expect(input).toHaveClass('my-field');
      fireEvent.change(input, { target: { value: 'graph' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0][0] as ChangeEvent<HTMLInputElement>).target.value).toBe('graph');
    });

    it('omits the label element when no label is supplied', () => {
      render(<TextField aria-label="Unlabelled field" />);
      expect(screen.getByLabelText('Unlabelled field')).toBeInTheDocument();
      expect(screen.queryByText('Node name')).not.toBeInTheDocument();
    });
  });

  describe('TextArea', () => {
    it('associates the label with the textarea and reports edits', () => {
      const onChange = vi.fn();
      render(<TextArea label="Notes" onChange={onChange} />);
      const textarea = screen.getByLabelText('Notes');
      expect(textarea.tagName).toBe('TEXTAREA');
      fireEvent.change(textarea, { target: { value: 'Line one\nLine two' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0][0] as ChangeEvent<HTMLTextAreaElement>).target.value).toBe('Line one\nLine two');
    });
  });

  describe('Select', () => {
    it('renders labelled options and reports the chosen value', () => {
      const onChange = vi.fn();
      render(<Select label="View" onChange={onChange} defaultValue="list"><option value="list">List</option><option value="graph">Graph</option></Select>);
      const select = screen.getByLabelText('View');
      expect(select).toHaveValue('list');
      expect(screen.getByRole('option', { name: 'Graph' })).toBeInTheDocument();
      fireEvent.change(select, { target: { value: 'graph' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0][0] as ChangeEvent<HTMLSelectElement>).target.value).toBe('graph');
    });

    it('forwards disabled state', () => {
      render(<Select label="View" disabled><option value="list">List</option></Select>);
      expect(screen.getByLabelText('View')).toBeDisabled();
    });
  });

  describe('Slider', () => {
    it('exposes range attributes and reports numeric values', () => {
      const onChange = vi.fn();
      render(<Slider label="Opacity" value={0.5} min={0} max={1} step={0.1} onChange={onChange} />);
      const slider = screen.getByRole('slider', { name: 'Opacity' });
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1');
      expect(slider).toHaveAttribute('step', '0.1');
      expect(slider).toHaveValue('0.5');
      fireEvent.change(slider, { target: { value: '0.8' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(0.8);
    });

    it('uses default bounds and a custom display label', () => {
      render(<Slider label="Speed" value={0.25} onChange={vi.fn()} display="25%" />);
      const slider = screen.getByRole('slider', { name: 'Speed' });
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1');
      expect(slider).toHaveAttribute('step', '0.01');
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.queryByText('0.25')).not.toBeInTheDocument();
    });
  });

  describe('Toggle', () => {
    it('reflects checked state and toggles to the inverse value', () => {
      const onChange = vi.fn();
      const { rerender } = render(<Toggle label="Dark mode" checked onChange={onChange} />);
      const control = screen.getByRole('switch', { name: 'Dark mode' });
      expect(control).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(control);
      expect(onChange).toHaveBeenCalledWith(false);

      rerender(<Toggle label="Dark mode" checked={false} onChange={onChange} />);
      expect(control).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(control);
      expect(onChange).toHaveBeenLastCalledWith(true);
    });

    it('renders the hint text', () => {
      render(<Toggle label="Autosave" checked={false} onChange={vi.fn()} hint="Saves locally" />);
      expect(screen.getByText('Autosave')).toBeInTheDocument();
      expect(screen.getByText('Saves locally')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Autosave' })).toHaveAttribute('aria-checked', 'false');
    });
  });
});
