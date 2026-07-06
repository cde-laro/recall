// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Timer } from './Timer';

afterEach(() => { vi.useRealTimers(); cleanup(); });

describe('Timer countdown', () => {
  it('counts down from countdownMs and fires onExpire once at zero', () => {
    vi.useFakeTimers();
    const now = 1_000_000;
    vi.setSystemTime(now);
    const onExpire = vi.fn();
    render(<Timer startTime={now} endTime={null} countdownMs={2000} onExpire={onExpire} />);
    // rendu initial : affiche le budget complet (00:02)
    expect(document.querySelector('.timer-val')?.textContent).toContain('00:02');
    // clock au-delà de l'expiration + un tick
    act(() => { vi.setSystemTime(now + 2500); vi.advanceTimersByTime(50); });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.timer-val')?.textContent).toContain('00:00');
    // ticks suivants : ne re-tire pas onExpire
    act(() => { vi.setSystemTime(now + 4000); vi.advanceTimersByTime(50); });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('counts up normally when no countdownMs is given', () => {
    vi.useFakeTimers();
    const now = 500_000;
    vi.setSystemTime(now);
    render(<Timer startTime={now} endTime={null} />);
    act(() => { vi.setSystemTime(now + 1000); vi.advanceTimersByTime(50); });
    expect(document.querySelector('.timer-val')?.textContent).toContain('00:01');
  });

  it('shows the urgent class under 30s remaining', () => {
    vi.useFakeTimers();
    const now = 2_000_000;
    vi.setSystemTime(now);
    render(<Timer startTime={now} endTime={null} countdownMs={40_000} />);
    // 40s budget, avance à 15s restantes (25s écoulées)
    act(() => { vi.setSystemTime(now + 25_000); vi.advanceTimersByTime(50); });
    expect(document.querySelector('.timer-val')?.classList.contains('urgent')).toBe(true);
  });
});
