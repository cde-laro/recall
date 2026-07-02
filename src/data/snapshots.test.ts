import { describe, it, expect } from 'vitest';
import lolFr from './lol.fr.json';
import lolEn from './lol.en.json';
import valorantFr from './valorant.fr.json';
import valorantEn from './valorant.en.json';
import overwatchFr from './overwatch.fr.json';
import overwatchEn from './overwatch.en.json';

const SNAPSHOTS = {
  'lol.fr': lolFr,
  'lol.en': lolEn,
  'valorant.fr': valorantFr,
  'valorant.en': valorantEn,
  'overwatch.fr': overwatchFr,
  'overwatch.en': overwatchEn,
};

describe('snapshots committés', () => {
  for (const [name, snap] of Object.entries(SNAPSHOTS)) {
    it(`${name} est exploitable comme fallback`, () => {
      expect(snap.characters.length).toBeGreaterThan(10);
      for (const c of snap.characters) {
        expect(c.name).toBeTruthy();
        expect(c.id).toBeTruthy();
        expect(c.imageUrl).toMatch(/^https:\/\//);
      }
    });
  }
});
