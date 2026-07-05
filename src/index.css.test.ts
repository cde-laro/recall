// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf-8');

describe('index.css', () => {
  it('pauses the portrait marquee with !important under prefers-reduced-motion', () => {
    // Sans !important, le raccourci `animation` de .marquee-row (déclaré plus
    // bas dans le fichier) réinitialise animation-play-state à `running` via
    // l'ordre de cascade — régression réelle déjà rencontrée une fois.
    const reducedMotionBlock = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);
    expect(reducedMotionBlock).not.toBeNull();
    expect(reducedMotionBlock![0]).toMatch(/\.marquee-row\s*\{\s*animation-play-state:\s*paused\s*!important;?\s*\}/);
  });
});
