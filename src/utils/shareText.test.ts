import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';

describe('buildShareText', () => {
  it('builds a French share text without record', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, score: 420, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⭐ 420 pts\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 04:23.45\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in French', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, score: 420, isNewRecord: true, lang: 'fr' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⭐ 420 pts\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 04:23.45 — Nouveau record !\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('adds the record suffix in English', () => {
    expect(
      buildShareText({ game: 'lol', found: 168, total: 168, timeMs: 263450, score: 420, isNewRecord: true, lang: 'en' })
    ).toBe(
      'RECALL/League — 168/168 🏆\n⭐ 420 pts\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 04:23.45 — New record!\nhttps://cde-laro.dev/recall/league'
    );
  });

  it('uses the Valorant label and URL', () => {
    expect(
      buildShareText({ game: 'valorant', found: 27, total: 27, timeMs: 61000, score: 87, isNewRecord: false, lang: 'en' })
    ).toBe(
      'RECALL/Valorant — 27/27 🏆\n⭐ 87 pts\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 01:01.00\nhttps://cde-laro.dev/recall/valorant'
    );
  });

  it('uses the Overwatch label and URL', () => {
    expect(
      buildShareText({ game: 'overwatch', found: 42, total: 42, timeMs: 5990, score: 903, isNewRecord: false, lang: 'fr' })
    ).toBe(
      'RECALL/Overwatch — 42/42 🏆\n⭐ 903 pts\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 00:05.99\nhttps://cde-laro.dev/recall/overwatch'
    );
  });

  it('shows found/total without trophy on a partial (gave up) run', () => {
    const txt = buildShareText({ game: 'overwatch', found: 12, total: 42, timeMs: 30000, score: 34, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('RECALL/Overwatch — 12/42');
    expect(txt).not.toContain('🏆');
  });

  it('never appends the record suffix on a partial run even if isNewRecord is true', () => {
    const txt = buildShareText({ game: 'lol', found: 5, total: 168, timeMs: 30000, score: 15, isNewRecord: true, lang: 'fr' });
    expect(txt).not.toContain('Nouveau record');
    expect(txt).toContain('5/168');
  });

  it('renders a full green bar only when complete', () => {
    const txt = buildShareText({ game: 'lol', found: 172, total: 172, timeMs: 61000, score: 500, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩');
    expect(txt).not.toContain('⬛');
  });

  it('clamps a nearly-complete partial run to 9 cells', () => {
    const txt = buildShareText({ game: 'lol', found: 171, total: 172, timeMs: 61000, score: 490, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('🟩🟩🟩🟩🟩🟩🟩🟩🟩⬛');
  });

  it('shows at least one green cell as soon as something was found', () => {
    const txt = buildShareText({ game: 'lol', found: 1, total: 172, timeMs: 61000, score: 1, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('🟩⬛⬛⬛⬛⬛⬛⬛⬛⬛');
  });

  it('shows an empty bar when nothing was found', () => {
    const txt = buildShareText({ game: 'overwatch', found: 0, total: 42, timeMs: 5000, score: 0, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛');
    expect(txt).not.toContain('🟩');
  });

  it('includes the score line even when the score is zero', () => {
    const txt = buildShareText({ game: 'overwatch', found: 0, total: 42, timeMs: 5000, score: 0, isNewRecord: false, lang: 'fr' });
    expect(txt).toContain('⭐ 0 pts');
  });
});
