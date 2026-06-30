import { describe, it, expect } from 'vitest';
import { nextMidnight, readCache, writeCache } from './dataCache';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  } as Storage;
}

describe('nextMidnight', () => {
  it('returns the next local midnight strictly after now', () => {
    const now = new Date(2026, 5, 30, 14, 0, 0).getTime();
    const expected = new Date(2026, 6, 1, 0, 0, 0).getTime();
    expect(nextMidnight(now)).toBe(expected);
  });
});

describe('readCache / writeCache', () => {
  it('returns the stored value before expiry', () => {
    const s = fakeStorage();
    const now = 1000;
    writeCache(s, 'k', { hello: 'world' }, now + 5000);
    expect(readCache<{ hello: string }>(s, 'k', now + 1000)).toEqual({ hello: 'world' });
  });
  it('returns null once expired', () => {
    const s = fakeStorage();
    writeCache(s, 'k', { hello: 'world' }, 2000);
    expect(readCache(s, 'k', 3000)).toBeNull();
  });
  it('returns null when nothing stored', () => {
    expect(readCache(fakeStorage(), 'missing', 0)).toBeNull();
  });
  it('returns null on corrupt JSON without throwing', () => {
    const s = fakeStorage();
    s.setItem('k', '{not json');
    expect(readCache(s, 'k', 0)).toBeNull();
  });
});
