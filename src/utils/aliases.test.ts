import { describe, it, expect } from 'vitest';
import { findCharacter } from './aliases';
import type { Character } from '../hooks/useGameData';

const LOL: Character[] = [
  { name: 'Miss Fortune', id: 'MissFortune', imageUrl: '' },
  { name: 'Jarvan IV', id: 'JarvanIV', imageUrl: '' },
  { name: 'Aurelion Sol', id: 'AurelionSol', imageUrl: '' },
  { name: 'Wukong', id: 'MonkeyKing', imageUrl: '' },
  { name: 'Nunu et Willump', id: 'Nunu', imageUrl: '' },
  { name: 'Dr. Mundo', id: 'DrMundo', imageUrl: '' },
  { name: "Kai'Sa", id: 'Kaisa', imageUrl: '' },
];

describe('findCharacter', () => {
  it('matches the exact name like before (accents, apostrophes)', () => {
    expect(findCharacter(LOL, "kai'sa", 'lol')?.id).toBe('Kaisa');
    expect(findCharacter(LOL, 'KAISA', 'lol')?.id).toBe('Kaisa');
  });

  it('resolves common LoL abbreviations to the right champion', () => {
    expect(findCharacter(LOL, 'mf', 'lol')?.id).toBe('MissFortune');
    expect(findCharacter(LOL, 'j4', 'lol')?.id).toBe('JarvanIV');
    expect(findCharacter(LOL, 'asol', 'lol')?.id).toBe('AurelionSol');
    expect(findCharacter(LOL, 'mundo', 'lol')?.id).toBe('DrMundo');
  });

  it('resolves aliases via champion id regardless of localized name', () => {
    // liste FR : "Nunu et Willump", mais l'alias vise l'id "Nunu"
    expect(findCharacter(LOL, 'nunu', 'lol')?.id).toBe('Nunu');
    // saisie EN sur liste FR
    expect(findCharacter(LOL, 'nunu & willump', 'lol')?.id).toBe('Nunu');
    expect(findCharacter(LOL, 'monkey king', 'lol')?.id).toBe('MonkeyKing');
  });

  it('returns null for unknown input or empty query', () => {
    expect(findCharacter(LOL, 'xyz', 'lol')).toBeNull();
    expect(findCharacter(LOL, '   ', 'lol')).toBeNull();
  });

  it('does not apply LoL aliases to other games', () => {
    const VAL: Character[] = [{ name: 'Killjoy', id: 'uuid-kj', imageUrl: '' }];
    expect(findCharacter(VAL, 'mf', 'valorant')).toBeNull();
    expect(findCharacter(VAL, 'kj', 'valorant')?.id).toBe('uuid-kj');
  });

  it('resolves Overwatch aliases against hero keys', () => {
    const OW: Character[] = [
      { name: 'Soldier: 76', id: 'soldier-76', imageUrl: '' },
      { name: 'Torbjörn', id: 'torbjorn', imageUrl: '' },
    ];
    expect(findCharacter(OW, 'soldier', 'overwatch')?.id).toBe('soldier-76');
    expect(findCharacter(OW, 'torb', 'overwatch')?.id).toBe('torbjorn');
  });

  it('accepts a slight typo (single edit) and resolves it', () => {
    expect(findCharacter(LOL, 'miss fortue', 'lol')?.id).toBe('MissFortune'); // n manquant
    expect(findCharacter(LOL, 'aurelon sol', 'lol')?.id).toBe('AurelionSol'); // i manquant
  });

  it('resolves a typo against a single candidate but stays null when ambiguous', () => {
    const ONE: Character[] = [{ name: 'Karma', id: 'Karma', imageUrl: '' }];
    expect(findCharacter(ONE, 'karpa', 'lol')?.id).toBe('Karma'); // dist 1, candidat unique
    const AMBI: Character[] = [
      { name: 'Karma', id: 'Karma', imageUrl: '' },
      { name: 'Karsa', id: 'Karsa', imageUrl: '' },
    ];
    expect(findCharacter(AMBI, 'karpa', 'lol')).toBeNull(); // dist 1 des deux → ambigu
  });

  it('does not fuzzy-match very short inputs even with a single candidate', () => {
    const ONE: Character[] = [{ name: 'Lux', id: 'Lux', imageUrl: '' }];
    // 'lax' est à distance 1 de 'lux', mais len < 4 → pas de fuzzy
    expect(findCharacter(ONE, 'lax', 'lol')).toBeNull();
  });
});
