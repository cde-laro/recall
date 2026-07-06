import { formatTime } from './formatTime';
import type { GameId } from '../hooks/useGameData';
import type { GameMode, TaDuration } from '../gameMeta';

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
  fr: ' - Nouveau record !',
  en: ' - New record!',
};

const IN_MIN: Record<'fr' | 'en', (d: number) => string> = {
  fr: d => `en ${d} min`,
  en: d => `in ${d} min`,
};

interface ShareTextOptions {
  game: GameId;
  mode: GameMode;
  found: number;
  total: number;
  timeMs: number;
  score: number;
  taDuration: TaDuration;
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

export function buildShareText({ game, mode, found, total, timeMs, score, taDuration, isNewRecord, lang }: ShareTextOptions): string {
  const { mmss, cs } = formatTime(timeMs);
  const complete = found >= total;
  const trophy = complete ? ' 🏆' : '';
  const bar = buildBar(found, total);
  const url = GAME_URLS[game];
  const record = RECORD_SUFFIX[lang];

  if (mode === 'timeattack') {
    // Le suffixe record s'applique même sur un run partiel (résultat normal).
    const rec = isNewRecord ? record : '';
    return [
      `RECALL/${GAME_LABELS[game]} - ${found}/${total}${trophy} ${IN_MIN[lang](taDuration)}${rec}`,
      bar,
      url,
    ].join('\n');
  }

  // speedrun & combo : suffixe record seulement en run complète.
  const rec = complete && isNewRecord ? record : '';
  const header = `RECALL/${GAME_LABELS[game]} - ${found}/${total}${trophy}`;

  if (mode === 'combo') {
    return [header, `⭐ ${score} pts${rec}`, bar, `⏱️ ${mmss}.${cs}`, url].join('\n');
  }
  // speedrun
  return [header, bar, `⏱️ ${mmss}.${cs}${rec}`, url].join('\n');
}
