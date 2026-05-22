import { describe, it, expect } from 'vitest';
import { normalize } from './normalize';

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('Aatrox')).toBe('aatrox');
  });
  it('strips apostrophes', () => {
    expect(normalize("Kai'Sa")).toBe('kaisa');
  });
  it('strips accents', () => {
    expect(normalize('Renéka')).toBe('reneka');
  });
  it('strips ampersand and spaces', () => {
    expect(normalize('Nunu & Willump')).toBe('nunuwillump');
  });
  it('strips dots', () => {
    expect(normalize('Dr. Mundo')).toBe('drmundo');
  });
  it('empty string', () => {
    expect(normalize('')).toBe('');
  });
});
