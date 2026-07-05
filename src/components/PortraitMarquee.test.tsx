// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PortraitMarquee } from './PortraitMarquee';

describe('PortraitMarquee', () => {
  it('is purely decorative: aria-hidden, several rows of images', () => {
    const { container } = render(<PortraitMarquee />);
    const wrapper = container.querySelector('.portrait-marquee');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    const rows = container.querySelectorAll('.marquee-row');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    rows.forEach(row => {
      expect(row.querySelectorAll('img').length).toBeGreaterThan(0);
    });
  });

  it('alternates scroll direction row by row', () => {
    const { container } = render(<PortraitMarquee />);
    const rows = Array.from(container.querySelectorAll('.marquee-row'));
    rows.forEach((row, i) => {
      expect(row.classList.contains('marquee-row--reverse')).toBe(i % 2 === 1);
    });
  });
});
