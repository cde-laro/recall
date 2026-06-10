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
});
