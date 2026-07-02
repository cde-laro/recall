// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameData } from './useGameData';

describe('useGameData — fallback snapshot', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sert le snapshot local avec stale=true quand l'API échoue", async () => {
    const { result } = renderHook(() => useGameData('valorant', 'fr'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(true);
    expect(result.current.characters.length).toBeGreaterThan(10);
    // Les données de secours ne doivent pas gagner le cache : on retente l'API au prochain chargement.
    expect(localStorage.getItem('memochamp_cache_valorant_fr')).toBeNull();
  });

  it("sert le cache du jour sans fetch (pas d'écrasement par le snapshot)", async () => {
    const characters = [{ name: 'CacheJett', id: 'x', imageUrl: 'https://example.test/x.png' }];
    localStorage.setItem(
      'memochamp_cache_valorant_fr',
      JSON.stringify({ expiresAt: Date.now() + 60_000, value: { version: '', characters } })
    );
    const { result } = renderHook(() => useGameData('valorant', 'fr'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.characters).toEqual(characters);
    expect(result.current.stale).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
