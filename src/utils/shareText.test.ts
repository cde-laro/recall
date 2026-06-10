import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';

describe('buildShareText', () => {
  it('builds a French share text without record', () => {
    expect(
      buildShareText({ game: 'lol', total: 168, timeMs: 263450, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in French', () => {
    expect(
      buildShareText({ game: 'lol', total: 168, timeMs: 263450, isNewRecord: true, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45 — Nouveau record !\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in English', () => {
    expect(
      buildShareText({ game: 'lol', total: 168, timeMs: 263450, isNewRecord: true, lang: 'en' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⏱️ 04:23.45 — New record!\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('uses the Valorant label and URL', () => {
    expect(
      buildShareText({ game: 'valorant', total: 27, timeMs: 61000, isNewRecord: false, lang: 'en' })
    ).toBe(
      'RECALL/Valorant — 27/27 🏆\n⏱️ 01:01.00\nhttps://cde-laro.dev/recall/valorant'
    );
  });

  it('uses the Overwatch label and URL', () => {
    expect(
      buildShareText({ game: 'overwatch', total: 42, timeMs: 5990, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/Overwatch — 42/42 🏆\n⏱️ 00:05.99\nhttps://cde-laro.dev/recall/overwatch'
    );
  });
});
