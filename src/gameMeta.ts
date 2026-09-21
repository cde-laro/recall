import type { GameId } from './hooks/useGameData';

export const GAME_LABELS: Record<GameId, string> = {
  lol: 'League of Legends',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
  'marvel-rivals': 'Marvel Rivals',
};

export const GAME_PATHS: Record<GameId, string> = {
  lol: '/league',
  valorant: '/valorant',
  overwatch: '/overwatch',
  'marvel-rivals': '/marvel-rivals',
};

export const BRAND_MARK: Record<GameId, string> = {
  lol: 'L',
  valorant: 'V',
  overwatch: 'O',
  'marvel-rivals': 'MR',
};

export type GameMode = 'speedrun' | 'combo' | 'timeattack';
export const GAME_MODES: GameMode[] = ['speedrun', 'combo', 'timeattack'];

export const TA_DURATIONS = [5, 10] as const;
export type TaDuration = (typeof TA_DURATIONS)[number];

// 'lower' = plus petit est mieux (temps) ; 'higher' = plus grand est mieux.
export const MODE_BETTER: Record<GameMode, 'lower' | 'higher'> = {
  speedrun: 'lower',
  combo: 'higher',
  timeattack: 'higher',
};

// Clé localStorage du record du mode. Speedrun/Combo réutilisent les clés
// historiques (best time / best score) ; Contre la montre a une clé par durée.
export function recordKey(mode: GameMode, game: GameId, taDuration: TaDuration): string {
  switch (mode) {
    case 'speedrun': return `memochamp_best_${game}`;
    case 'combo': return `memochamp_bestscore_${game}`;
    case 'timeattack': return `memochamp_ta_${game}_${taDuration}`;
  }
}
