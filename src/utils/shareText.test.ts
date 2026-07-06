import { describe, it, expect } from 'vitest';
import { buildShareText } from './shareText';

describe('buildShareText - speedrun', () => {
  it('builds a complete run with the time line and no score line', () => {
    expect(buildShareText({
      game: 'lol', mode: 'speedrun', found: 168, total: 168, timeMs: 263450,
      score: 0, taDuration: 5, isNewRecord: false, lang: 'fr',
    })).toBe(
      'RECALL/League - 168/168 🏆\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 04:23.45\nhttps://cde-laro.dev/recall/league'
    );
  });
  it('appends the record suffix on the time line (fr)', () => {
    const txt = buildShareText({
      game: 'lol', mode: 'speedrun', found: 168, total: 168, timeMs: 263450,
      score: 0, taDuration: 5, isNewRecord: true, lang: 'fr',
    });
    expect(txt).toContain('⏱️ 04:23.45 - Nouveau record !');
    expect(txt).not.toContain('⭐');
  });
  it('never appends the record suffix on a partial run', () => {
    const txt = buildShareText({
      game: 'lol', mode: 'speedrun', found: 5, total: 168, timeMs: 30000,
      score: 0, taDuration: 5, isNewRecord: true, lang: 'fr',
    });
    expect(txt).not.toContain('Nouveau record');
    expect(txt).toContain('RECALL/League - 5/168');
    expect(txt).not.toContain('🏆');
  });
});

describe('buildShareText - combo', () => {
  it('puts the record suffix on the score line, not the time line', () => {
    const txt = buildShareText({
      game: 'valorant', mode: 'combo', found: 27, total: 27, timeMs: 61000,
      score: 420, taDuration: 5, isNewRecord: true, lang: 'en',
    });
    expect(txt).toBe(
      'RECALL/Valorant - 27/27 🏆\n⭐ 420 pts - New record!\n🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩\n⏱️ 01:01.00\nhttps://cde-laro.dev/recall/valorant'
    );
  });
  it('includes the score line even when the score is zero', () => {
    const txt = buildShareText({
      game: 'overwatch', mode: 'combo', found: 0, total: 42, timeMs: 5000,
      score: 0, taDuration: 5, isNewRecord: false, lang: 'fr',
    });
    expect(txt).toContain('⭐ 0 pts');
  });
});

describe('buildShareText - timeattack', () => {
  it('shows found/total with the duration and no time line', () => {
    const txt = buildShareText({
      game: 'overwatch', mode: 'timeattack', found: 18, total: 42, timeMs: 300000,
      score: 0, taDuration: 5, isNewRecord: false, lang: 'fr',
    });
    expect(txt).toBe(
      'RECALL/Overwatch - 18/42 en 5 min\n🟩🟩🟩🟩⬛⬛⬛⬛⬛⬛\nhttps://cde-laro.dev/recall/overwatch'
    );
  });
  it('appends the record suffix on a partial run (partial is the normal result)', () => {
    const txt = buildShareText({
      game: 'lol', mode: 'timeattack', found: 30, total: 168, timeMs: 600000,
      score: 0, taDuration: 10, isNewRecord: true, lang: 'en',
    });
    expect(txt).toContain('RECALL/League - 30/168 in 10 min - New record!');
    expect(txt).not.toContain('⏱️');
  });
  it('shows the trophy when all found before time runs out', () => {
    const txt = buildShareText({
      game: 'valorant', mode: 'timeattack', found: 27, total: 27, timeMs: 120000,
      score: 0, taDuration: 5, isNewRecord: false, lang: 'fr',
    });
    expect(txt).toContain('RECALL/Valorant - 27/27 🏆 en 5 min');
  });
});
