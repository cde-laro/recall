import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';

describe('buildShareText', () => {
  it('builds a French share text without record', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in French', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, isNewRecord: true, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45 — Nouveau record !\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in English', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, isNewRecord: true, lang: 'en' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45 — New record!\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('uses the Valorant label and URL', () => {
    expect(
      buildShareText({ game: 'valorant', found: 27, total: 27, timeMs: 61000, isNewRecord: false, lang: 'en' })
    ).toBe(
      'RECALL/Valorant — 27/27 🏆\n⏱️ 01:01.00\nhttps://cde-laro.dev/recall/valorant'
    );
  });

  it('uses the Overwatch label and URL', () => {
    expect(
      buildShareText({ game: 'overwatch', found: 42, total: 42, timeMs: 5990, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/Overwatch — 42/42 🏆\n⏱️ 00:05.99\nhttps://cde-laro.dev/recall/overwatch'
    );
  });

  it('shows found/total without trophy on a partial (gave up) run', () => {
    const txt = buildShareText({ game: 'overwatch', found: 12, total: 42, timeMs: 30000, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('RECALL/Overwatch — 12/42');
    expect(txt).not.toContain('🏆');
  });

  it('never appends the record suffix on a partial run even if isNewRecord is true', () => {
    const txt = buildShareText({ game: 'lol', found: 5, total: 168, timeMs: 30000, isNewRecord: true, lang: 'fr' });
    expect(txt).not.toContain('Nouveau record');
    expect(txt).toContain('5/168');
  });
});
