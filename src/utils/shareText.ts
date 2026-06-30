import { formatTime } from './formatTime';
import type { GameId } from '../hooks/useGameData';

const GAME_LABELS: Record<GameId, string> = {
  lol: 'League',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

const GAME_URLS: Record<GameId, string> = {
  lol: 'https://cde-laro.dev/recall/league',
  valorant: 'https://cde-laro.dev/recall/valorant',
  overwatch: 'https://cde-laro.dev/recall/overwatch',
};

const RECORD_SUFFIX: Record<'fr' | 'en', string> = {
  fr: ' — Nouveau record !',
  en: ' — New record!',
};

interface ShareTextOptions {
  game: GameId;
  found: number;
  total: number;
  timeMs: number;
  isNewRecord: boolean;
  lang: 'fr' | 'en';
}

export function buildShareText({ game, found, total, timeMs, isNewRecord, lang }: ShareTextOptions): string {
  const { mmss, cs } = formatTime(timeMs);
  const complete = found >= total;
  const record = complete && isNewRecord ? RECORD_SUFFIX[lang] : '';
  const scoreLine = complete ? `${total}/${total} 🏆` : `${found}/${total}`;
  return [
    `RECALL/${GAME_LABELS[game]} — ${scoreLine}`,
    `⏱️ ${mmss}.${cs}${record}`,
    GAME_URLS[game],
  ].join('\n');
}
