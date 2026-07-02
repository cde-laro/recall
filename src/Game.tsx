import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameData, type GameId } from './hooks/useGameData';
import { normalize } from './utils/normalize';
import { formatTime } from './utils/formatTime';
import { findCharacter } from './utils/aliases';
import { Timer } from './components/Timer';
import { ChampionGrid } from './components/ChampionGrid';
import { CompleteModal } from './components/CompleteModal';

interface Props {
  game: GameId;
  lang: 'fr' | 'en';
  onToggleLang: () => void;
}

const GAME_LABELS: Record<GameId, string> = {
  lol: 'League of Legends',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

const GAME_PATHS: Record<GameId, string> = {
  lol: '/league',
  valorant: '/valorant',
  overwatch: '/overwatch',
};

const BRAND_MARK: Record<GameId, string> = {
  lol: 'L',
  valorant: 'V',
  overwatch: 'O',
};

export function Game({ game, lang, onToggleLang }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
  const [gameOpen, setGameOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { characters: champions, loading, error } = useGameData(game, lang);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('memochamp_theme', theme);
  }, [theme]);

  // Per-game document title + meta description
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

  // Close popovers on outside click
  useEffect(() => {
    if (!gameOpen && !menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (gameRef.current && !gameRef.current.contains(e.target as Node)) setGameOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [gameOpen, menuOpen]);

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
    if (startTime == null) setStartTime(now);
    setEndTime(now);
    setCompleted(false);
    setIsNewRecord(false);
    modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
  }, [startTime, t]);

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
    <div className="shell">
      <aside className="rail">
        <div className="rail-head">
          <div className="brand">
            <div className="brand-mark">{BRAND_MARK[game]}</div>
            <div>
              <div className="brand-text">RECALL</div>
              <div className="brand-sub">{t('brand.tagline')}</div>
            </div>
          </div>
          <div className="rail-controls">
            <button className="theme-btn" onClick={toggleTheme} aria-label={t('topbar.toggleTheme')}>
              <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            <button className="lang-btn" onClick={onToggleLang} aria-label={t('topbar.switchLanguage')}>
              <span aria-hidden="true">{lang === 'fr' ? '🇬🇧' : '🇫🇷'}</span>
            </button>
            <div className="menu-wrap" ref={menuRef}>
              <button className="icon-btn" onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-label="Menu">⋯</button>
              {menuOpen && (
                <div className="popover">
                  <button className="popover-item" onClick={() => { setMenuOpen(false); resetGame(); }}>{t('topbar.newRun')}</button>
                  <button className="popover-item" onClick={() => { setMenuOpen(false); handleResetRecord(); }}>{t('topbar.resetRecord')}</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rail-game">
          <span className="rail-lbl">{t('sidebar.game')}</span>
          <div className="game-select" ref={gameRef}>
            <button className="game-select-btn" onClick={() => setGameOpen(o => !o)} aria-haspopup="menu" aria-expanded={gameOpen}>
              <span className="game-select-mark">{BRAND_MARK[game]}</span>
              <span className="game-select-name">{GAME_LABELS[game]}</span>
              <span className="game-select-chev" aria-hidden="true">▾</span>
            </button>
            {gameOpen && (
              <div className="popover popover--full">
                {(Object.keys(GAME_LABELS) as GameId[]).map(g => (
                  <button
                    key={g}
                    className={`popover-item${g === game ? ' current' : ''}`}
                    onClick={() => { setGameOpen(false); navigate(GAME_PATHS[g]); }}
                  >
                    <span className="game-select-mark">{BRAND_MARK[g]}</span>
                    {GAME_LABELS[g]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stats">
          <div className="stat stat--progress">
            <span className="stat-lbl">{t('scoreboard.found')}</span>
            <span className="stat-big" aria-live="polite">
              {String(found.size).padStart(3, '0')}<span className="stat-sep">/{champions.length}</span>
            </span>
            <div className="progress-track in-cell">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="stat">
            <span className="stat-lbl">{t('scoreboard.bestTime')}</span>
            <span className="stat-big" style={{ color: bestDisplay ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
              {bestDisplay ? bestDisplay.mmss : '--:--'}
            </span>
          </div>
        </div>

        <div className="about">
          <div className="about-title">{t('about.title')}</div>
          <div className="about-body">{t('about.body')}</div>
        </div>
      </aside>

      <main className="main">
        <div className="main-top">
          <div className="timebar">
            <span className="timebar-lbl">{t('scoreboard.timer')}</span>
            <Timer startTime={startTime} endTime={endTime} />
          </div>
          <button className="giveup" onClick={handleGiveUp} disabled={endTime != null}>
            <span className="giveup-flag" aria-hidden="true">⚑</span>
            <span className="giveup-text">
              <strong>{t('status.giveUp')}</strong>
              <em>{t('status.giveUpSub')}</em>
            </span>
          </button>
        </div>

        <div className={['command-bar', shake ? 'shake' : '', flash === 'correct' ? 'flash-correct' : '', flash === 'wrong' ? 'flash-wrong' : ''].filter(Boolean).join(' ')}>
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
        </div>

        <div className="subtitle">
          {lastFound ? (
            <span className="last-found">{t('status.lastFound')} <span className="name">{lastFound}</span></span>
          ) : (
            t('status.noHints')
          )}
        </div>

        {error ? (
          <div className="load-error" role="alert">
            <p>{t('error.loadFailed')}</p>
            <button className="icon-btn" onClick={() => window.location.reload()}>{t('error.retry')}</button>
          </div>
        ) : loading ? (
          <div className="loading-block">// Loading…</div>
        ) : (
          <ChampionGrid
            champions={champions}
            found={found}
            justFoundName={justFoundName}
            revealMissed={endTime != null && !completed}
          />
        )}
      </main>

      {showModal && endTime != null && startTime != null && (
        <CompleteModal
          game={game}
          total={champions.length}
          found={found.size}
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
