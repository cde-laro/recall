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
});
