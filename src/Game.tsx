import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameData, type GameId } from './hooks/useGameData';
import { normalize } from './utils/normalize';
import { formatTime } from './utils/formatTime';
import { findCharacter } from './utils/aliases';
import { TopBar } from './components/TopBar';
import { Timer } from './components/Timer';
import { ChampionGrid } from './components/ChampionGrid';
import { CompleteModal } from './components/CompleteModal';

interface Props {
  game: GameId;
  lang: 'fr' | 'en';
  onToggleLang: () => void;
}

const ALIAS_EXAMPLES: Record<GameId, string> = {
  lol: 'mf, j4, asol',
  valorant: 'brim, kj',
  overwatch: 'rein, hog, sym',
};

export function Game({ game, lang, onToggleLang }: Props) {
  const { t } = useTranslation();

  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('memochamp_theme') as 'dark' | 'light') ?? 'dark'
  );
  const [found, setFound] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const bestKey = `memochamp_best_${game}`;
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const raw = localStorage.getItem(`memochamp_best_${game}`);
    return raw ? Number(raw) : null;
  });
  const [showModal, setShowModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [justFoundName, setJustFoundName] = useState<string | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [resultFound, setResultFound] = useState(0);

  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { version, characters: champions, loading, error } = useGameData(game, lang);

  // Apply theme + game tokens
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('memochamp_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-game', game);
    const TITLES: Record<typeof game, string> = {
      lol: 'RECALL/League — All champions · cde-laro.dev',
      valorant: 'RECALL/Valorant — All agents · cde-laro.dev',
      overwatch: 'RECALL/Overwatch — All heroes · cde-laro.dev',
    };
    const DESCS: Record<typeof game, string> = {
      lol: 'Can you name every League of Legends champion from memory? No hints, no help.',
      valorant: 'Can you name every Valorant agent from memory? Test your knowledge.',
      overwatch: 'Can you name every Overwatch hero from memory? The ultimate recall challenge.',
    };
    document.title = TITLES[game];
    document.querySelector('meta[name="description"]')?.setAttribute('content', DESCS[game]);
  }, [game]);

  // Focus input
  useEffect(() => {
    if (endTime == null && !loading) inputRef.current?.focus();
  }, [endTime, loading]);

  const resetGame = useCallback(() => {
    if (modalTimerRef.current != null) clearTimeout(modalTimerRef.current);
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setShowModal(false);
    setIsNewRecord(false);
    setJustFoundName(null);
    setLastFound(null);
    setCompleted(false);
    setResultFound(0);
  }, []);

  const handleSubmit = useCallback(() => {
    if (endTime != null || !champions.length) return;
    if (!normalize(query)) return;

    const match = findCharacter(champions, query, game);
    if (match && !found.has(match.name)) {
      const next = new Set(found);
      next.add(match.name);
      const startedAt = startTime ?? Date.now();
      if (!startTime) setStartTime(startedAt);
      setFound(next);
      setLastFound(match.name);
      setJustFoundName(match.name);
      setTimeout(() => setJustFoundName(prev => prev === match.name ? null : prev), 900);
      setQuery('');
      setFlash('correct');
      setTimeout(() => setFlash(null), 320);

      if (next.size === champions.length) {
        const finishedAt = Date.now();
        setEndTime(finishedAt);
        setCompleted(true);
        setResultFound(champions.length);
        const elapsed = finishedAt - startedAt;
        const newRecord = bestTime == null || elapsed < bestTime;
        if (newRecord) {
          setBestTime(elapsed);
          localStorage.setItem(bestKey, String(elapsed));
        }
        setIsNewRecord(newRecord);
        modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
      }
    } else {
      setFlash('wrong');
      setShake(true);
      setTimeout(() => { setFlash(null); setShake(false); }, 360);
    }
  }, [query, found, startTime, endTime, champions, game, bestTime, bestKey]);

  const handleGiveUp = useCallback(() => {
    if (!confirm(t('confirm.giveUp'))) return;
    const now = Date.now();
    const startedAt = startTime ?? now;
    setResultFound(found.size);
    setCompleted(false);
    if (startTime == null) setStartTime(startedAt);
    setEndTime(now);
    setFound(new Set(champions.map(c => c.name)));
    setIsNewRecord(false);
    modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
  }, [champions, startTime, found, t]);

  const handleResetRecord = useCallback(() => {
    if (!confirm(t('confirm.resetRecord'))) return;
    localStorage.removeItem(bestKey);
    setBestTime(null);
  }, [t, bestKey]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const bestDisplay = bestTime != null ? formatTime(bestTime) : null;
  const pct = champions.length ? (found.size / champions.length) * 100 : 0;

  return (
    <div className="app">
      <TopBar
        version={version}
        theme={theme}
        lang={lang}
        game={game}
        onToggleTheme={toggleTheme}
        onToggleLang={onToggleLang}
        onNewRun={resetGame}
        onResetRecord={handleResetRecord}
      />

      <div className="sticky-command">
        <div className={['command-bar', shake ? 'shake' : '', flash === 'correct' ? 'flash-correct' : '', flash === 'wrong' ? 'flash-wrong' : ''].filter(Boolean).join(' ')}>
          <div className="cmd-stat">
            <span className="cmd-lbl">{t('scoreboard.found')}</span>
            <span className="cmd-num" aria-live="polite">{String(found.size).padStart(3, '0')}<span className="cmd-total">/{champions.length}</span></span>
          </div>
          <input
            ref={inputRef}
            autoFocus
            value={query}
            disabled={endTime != null || loading}
            aria-label={t('input.placeholder')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={endTime != null ? t('input.placeholderDone') : t('input.placeholder')}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <button className="cmd-submit" disabled={endTime != null || loading} onClick={handleSubmit}>
            {t('input.submit')}
          </button>
          <div className="cmd-stat">
            <span className="cmd-lbl">{t('scoreboard.bestTime')}</span>
            <span className="cmd-num" style={{ color: bestDisplay ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
              {bestDisplay ? bestDisplay.mmss : '--:--'}
            </span>
          </div>
        </div>
        <Timer startTime={startTime} endTime={endTime} />
      </div>

      <div className="status-row">
        <div>
          {lastFound ? (
            <span className="last-found">
              {t('status.lastFound')} <span className="name">{lastFound}</span>
            </span>
          ) : (
            !endTime && <span>{t('status.aliasHint', { examples: ALIAS_EXAMPLES[game] })}</span>
          )}
        </div>
        <div className="controls">
          <button className="icon-btn" onClick={handleGiveUp} disabled={endTime != null}>
            {t('status.giveUp')}
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {error ? (
        <div className="load-error" role="alert">
          <p>{t('error.loadFailed')}</p>
          <button className="icon-btn" onClick={() => window.location.reload()}>
            {t('error.retry')}
          </button>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
          // Loading…
        </div>
      ) : (
        <ChampionGrid
          champions={champions}
          found={found}
          justFoundName={justFoundName}
        />
      )}

      {showModal && endTime != null && startTime != null && (
        <CompleteModal
          game={game}
          total={champions.length}
          found={resultFound}
          completed={completed}
          lang={lang}
          time={endTime - startTime}
          bestTime={bestTime}
          isNewRecord={isNewRecord}
          onRestart={resetGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
