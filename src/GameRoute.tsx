import { useState, useEffect, useCallback } from 'react';
import i18n from './i18n';
import { Game } from './Game';
import type { GameId } from './hooks/useGameData';
import { GAME_MODES, TA_DURATIONS, type GameMode, type TaDuration } from './gameMeta';

function readMode(): GameMode {
  const raw = localStorage.getItem('memochamp_mode');
  return (GAME_MODES as string[]).includes(raw ?? '') ? (raw as GameMode) : 'speedrun';
}

function readDuration(): TaDuration {
  const raw = Number(localStorage.getItem('memochamp_ta_duration'));
  return (TA_DURATIONS as readonly number[]).includes(raw) ? (raw as TaDuration) : 5;
}

export function GameRoute({ game }: { game: GameId }) {
  const [lang, setLang] = useState<'fr' | 'en'>(
    () => (localStorage.getItem('memochamp_lang') as 'fr' | 'en') ?? 'fr'
  );
  const [mode, setMode] = useState<GameMode>(readMode);
  const [taDuration, setTaDuration] = useState<TaDuration>(readDuration);

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('memochamp_lang', lang);
  }, [lang]);

  useEffect(() => { localStorage.setItem('memochamp_mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('memochamp_ta_duration', String(taDuration)); }, [taDuration]);

  const toggleLang = useCallback(() => setLang(l => (l === 'fr' ? 'en' : 'fr')), []);

  // Remontage sur changement de jeu/langue/mode/durée = reset propre (pas
  // d'effet de reset dans Game). La durée ne participe à la key qu'en timeattack.
  const key = `${game}-${lang}-${mode}-${mode === 'timeattack' ? taDuration : ''}`;

  return (
    <Game
      key={key}
      game={game}
      lang={lang}
      onToggleLang={toggleLang}
      mode={mode}
      taDuration={taDuration}
      onChangeMode={setMode}
      onChangeDuration={setTaDuration}
    />
  );
}
