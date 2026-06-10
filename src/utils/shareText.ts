import { formatTime } from './formatTime';

type GameId = 'lol' | 'valorant' | 'overwatch';

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
  total: number;
  timeMs: number;
  isNewRecord: boolean;
  lang: 'fr' | 'en';
}

export function buildShareText({ game, total, timeMs, isNewRecord, lang }: ShareTextOptions): string {
  const { mmss, cs } = formatTime(timeMs);
  const record = isNewRecord ? RECORD_SUFFIX[lang] : '';
  return [
    `RECALL/${GAME_LABELS[game]} — ${total}/${total} 🏆`,
    `⏱️ ${mmss}.${cs}${record}`,
    GAME_URLS[game],
  ].join('\n');
}
