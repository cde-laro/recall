import { useState, useEffect, useCallback } from 'react';
import i18n from './i18n';
import { Game } from './Game';
import type { GameId } from './hooks/useGameData';

export function GameRoute({ game }: { game: GameId }) {
  const [lang, setLang] = useState<'fr' | 'en'>(
    () => (localStorage.getItem('memochamp_lang') as 'fr' | 'en') ?? 'fr'
  );

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('memochamp_lang', lang);
  }, [lang]);

  const toggleLang = useCallback(() => setLang(l => (l === 'fr' ? 'en' : 'fr')), []);

  return <Game key={`${game}-${lang}`} game={game} lang={lang} onToggleLang={toggleLang} />;
}
