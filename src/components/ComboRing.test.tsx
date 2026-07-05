// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ComboRing } from './ComboRing';

describe('ComboRing', () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders an idle ring before any find', () => {
    const { container } = render(<ComboRing comboBase={null} lastFindAt={null} />);
    expect(container.querySelector('.combo-ring-fill')).toHaveClass('idle');
    expect(container.querySelector('.combo-ring-inner')).toHaveTextContent('');
  });

  it('shows the current combo value right after a find', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const { container } = render(<ComboRing comboBase={3} lastFindAt={1_000_000} />);
    expect(container.querySelector('.combo-ring-inner')).toHaveTextContent('x3');
  });

  it('decays the displayed combo after 5s without a new find, floored at x1', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const { container } = render(<ComboRing comboBase={3} lastFindAt={1_000_000} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('.combo-ring-inner')).toHaveTextContent('x2');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('.combo-ring-inner')).toHaveTextContent('x1');
    act(() => {
      vi.advanceTimersByTime(50000);
    });
    expect(container.querySelector('.combo-ring-inner')).toHaveTextContent('x1');
  });

  it('restarts the ring animation (remounts the fill element) on a new find', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const { container, rerender } = render(<ComboRing comboBase={3} lastFindAt={1_000_000} />);
    const firstFill = container.querySelector('.combo-ring-fill');
    rerender(<ComboRing comboBase={4} lastFindAt={1_002_000} />);
    const secondFill = container.querySelector('.combo-ring-fill');
    expect(secondFill).not.toBe(firstFill);
  });
});
