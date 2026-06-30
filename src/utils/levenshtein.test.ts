import { describe, it, expect } from 'vitest';
import { levenshtein } from './levenshtein';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('jinx', 'jinx')).toBe(0);
  });
  it('counts a single substitution', () => {
    expect(levenshtein('jinx', 'jynx')).toBe(1);
  });
  it('counts a single deletion / insertion', () => {
    expect(levenshtein('tryndamere', 'tryndamer')).toBe(1);
    expect(levenshtein('aatrox', 'aatroxx')).toBe(1);
  });
  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });
});
