// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePreloadImages } from './usePreloadImages';

class FakeImage {
  static created: string[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(url: string) {
    FakeImage.created.push(url);
    // Simule un chargement synchrone : la file doit avancer jusqu'au bout.
    this.onload?.();
  }
}

describe('usePreloadImages', () => {
  beforeEach(() => {
    FakeImage.created = [];
    vi.stubGlobal('Image', FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('précharge toutes les urls, chacune une seule fois', () => {
    const urls = Array.from({ length: 20 }, (_, i) => `https://example.test/${i}.png`);
    renderHook(() => usePreloadImages(urls));
    expect(FakeImage.created).toHaveLength(20);
    expect(new Set(FakeImage.created)).toEqual(new Set(urls));
  });

  it('ne fait rien sur une liste vide', () => {
    renderHook(() => usePreloadImages([]));
    expect(FakeImage.created).toHaveLength(0);
  });
});
