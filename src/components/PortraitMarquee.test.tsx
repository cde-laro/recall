// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PortraitMarquee } from './PortraitMarquee';

describe('PortraitMarquee', () => {
  it('is purely decorative: aria-hidden, several rows of images', async () => {
    const { container } = render(<PortraitMarquee />);
    const wrapper = container.querySelector('.portrait-marquee');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    await waitFor(() => {
      expect(container.querySelectorAll('.marquee-row').length).toBe(6);
    });
    container.querySelectorAll('.marquee-row').forEach(row => {
      expect(row.querySelectorAll('img').length).toBeGreaterThan(0);
    });
  });

  it('alternates scroll direction row by row', async () => {
    const { container } = render(<PortraitMarquee />);
    await waitFor(() => {
      expect(container.querySelectorAll('.marquee-row').length).toBe(6);
    });
    const rows = Array.from(container.querySelectorAll('.marquee-row'));
    rows.forEach((row, i) => {
      expect(row.classList.contains('marquee-row--reverse')).toBe(i % 2 === 1);
    });
  });
});
