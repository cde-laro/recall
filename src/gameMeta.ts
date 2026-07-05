import type { GameId } from './hooks/useGameData';

export const GAME_LABELS: Record<GameId, string> = {
  lol: 'League of Legends',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

export const GAME_PATHS: Record<GameId, string> = {
  lol: '/league',
  valorant: '/valorant',
  overwatch: '/overwatch',
};

export const BRAND_MARK: Record<GameId, string> = {
  lol: 'L',
  valorant: 'V',
  overwatch: 'O',
};
