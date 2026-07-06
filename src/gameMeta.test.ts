import { describe, it, expect } from 'vitest';
import { recordKey, GAME_MODES, TA_DURATIONS, MODE_BETTER } from './gameMeta';

describe('recordKey', () => {
  it('maps speedrun to the legacy best-time key', () => {
    expect(recordKey('speedrun', 'lol', 5)).toBe('memochamp_best_lol');
  });
  it('maps combo to the legacy best-score key', () => {
    expect(recordKey('combo', 'valorant', 10)).toBe('memochamp_bestscore_valorant');
  });
  it('maps time attack to a per-duration key', () => {
    expect(recordKey('timeattack', 'overwatch', 5)).toBe('memochamp_ta_overwatch_5');
    expect(recordKey('timeattack', 'overwatch', 10)).toBe('memochamp_ta_overwatch_10');
  });
});

describe('mode constants', () => {
  it('lists the three modes and two durations', () => {
    expect(GAME_MODES).toEqual(['speedrun', 'combo', 'timeattack']);
    expect(TA_DURATIONS).toEqual([5, 10]);
  });
  it('knows which direction is better per mode', () => {
    expect(MODE_BETTER).toEqual({ speedrun: 'lower', combo: 'higher', timeattack: 'higher' });
  });
});
