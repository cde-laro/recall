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
  score: number;
  isNewRecord: boolean;
  lang: 'fr' | 'en';
}

const BAR_LENGTH = 10;

// Barre compressée façon Wordle : verte pour tous les jeux (décision spec).
// Partiel clampé à 1..9 pour ne jamais ressembler à un 0/x ou un x/x.
function buildBar(found: number, total: number): string {
  const complete = found >= total;
  let filled = complete ? BAR_LENGTH : Math.round((found / total) * BAR_LENGTH);
  if (!complete) filled = Math.min(BAR_LENGTH - 1, Math.max(found > 0 ? 1 : 0, filled));
  return '🟩'.repeat(filled) + '⬛'.repeat(BAR_LENGTH - filled);
}

export function buildShareText({ game, found, total, timeMs, score, isNewRecord, lang }: ShareTextOptions): string {
  const { mmss, cs } = formatTime(timeMs);
  const complete = found >= total;
  const record = complete && isNewRecord ? RECORD_SUFFIX[lang] : '';
  const progressLine = complete ? `${total}/${total} 🏆` : `${found}/${total}`;
  return [
    `RECALL/${GAME_LABELS[game]} — ${progressLine}`,
    `⭐ ${score} pts`,
    buildBar(found, total),
    `⏱️ ${mmss}.${cs}${record}`,
    GAME_URLS[game],
  ].join('\n');
}
