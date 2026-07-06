import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DotsThree, CaretDown, Flag } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameData, type GameId } from './hooks/useGameData';
import { usePreloadImages } from './hooks/usePreloadImages';
import { normalize } from './utils/normalize';
import { formatTime } from './utils/formatTime';
import { findCharacter } from './utils/aliases';
import { Timer } from './components/Timer';
import { ComboRing } from './components/ComboRing';
import { GameBadge } from './components/GameBadge';
import { ChampionGrid } from './components/ChampionGrid';
import { CompleteModal } from './components/CompleteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { GAME_LABELS, GAME_PATHS, BRAND_MARK, GAME_MODES, TA_DURATIONS, recordKey, type GameMode, type TaDuration } from './gameMeta';

interface Props {
  game: GameId;
  lang: 'fr' | 'en';
  onToggleLang: () => void;
  mode: GameMode;
  taDuration: TaDuration;
  onChangeMode: (mode: GameMode) => void;
  onChangeDuration: (d: TaDuration) => void;
}

export function Game({ game, lang, onToggleLang, mode, taDuration, onChangeMode, onChangeDuration }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [found, setFound] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const recKey = recordKey(mode, game, taDuration);
  const [best, setBest] = useState<number | null>(() => {
    const raw = localStorage.getItem(recKey);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [score, setScore] = useState(0);
  const [comboBase, setComboBase] = useState<number | null>(null);
  const [lastFindAt, setLastFindAt] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [endReason, setEndReason] = useState<'complete' | 'expired' | 'gaveup' | null>(null);
  const [justFoundName, setJustFoundName] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | 'duplicate' | null>(null);
  const [shake, setShake] = useState(false);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<'giveUp' | 'resetRecord' | null>(null);

  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const gameBtnRef = useRef<HTMLButtonElement>(null);
  const foundRef = useRef(found);
  const endTimeRef = useRef(endTime);
  const bestRef = useRef(best);
  // Miroirs à jour lus par handleExpire (fin par compte à rebours) sans le
  // rendre instable. Mis à jour en effet (jamais pendant le rendu).
  useEffect(() => {
    foundRef.current = found;
    endTimeRef.current = endTime;
    bestRef.current = best;
  });

  const { characters: champions, loading, error, stale } = useGameData(game, lang);

  // Portraits préchargés dès que le roster est connu → révélation instantanée.
  const portraitUrls = useMemo(() => champions.map(c => c.imageUrl), [champions]);
  usePreloadImages(portraitUrls);

  // Per-game document title + meta description
  useEffect(() => {
    document.documentElement.setAttribute('data-game', game);
    const TITLES: Record<typeof game, string> = {
      lol: 'RECALL/League - All champions',
      valorant: 'RECALL/Valorant - All agents',
      overwatch: 'RECALL/Overwatch - All heroes',
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

  // Évite un setShowModal orphelin si le composant est démonté (changement de
  // jeu/langue) dans les 500ms suivant une fin de run.
  useEffect(() => () => {
    if (modalTimerRef.current != null) clearTimeout(modalTimerRef.current);
  }, []);

  // Close popovers on outside click or Escape (focus revient au déclencheur)
  useEffect(() => {
    if (!gameOpen && !menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (gameRef.current && !gameRef.current.contains(e.target as Node)) setGameOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (gameOpen) { setGameOpen(false); gameBtnRef.current?.focus(); }
      if (menuOpen) { setMenuOpen(false); menuBtnRef.current?.focus(); }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOpen, menuOpen]);

  const resetGame = useCallback(() => {
    if (modalTimerRef.current != null) clearTimeout(modalTimerRef.current);
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setShowModal(false);
    setIsNewRecord(false);
    setEndReason(null);
    setJustFoundName(null);
    setDuplicateName(null);
    setLastFound(null);
    setCompleted(false);
    setScore(0);
    setComboBase(null);
    setLastFindAt(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (endTime != null || !champions.length) return;
    if (!normalize(query)) return;

    const match = findCharacter(champions, query, game);
    if (match && !found.has(match.name)) {
      const now = Date.now();
      const next = new Set(found);
      next.add(match.name);
      const startedAt = startTime ?? now;
      if (!startTime) setStartTime(startedAt);
      setFound(next);
      setLastFound(match.name);
      setJustFoundName(match.name);
      setTimeout(() => setJustFoundName(prev => prev === match.name ? null : prev), 900);
      setQuery('');
      setFlash('correct');
      setTimeout(() => setFlash(null), 320);

      // Combo/score uniquement en mode Combo : décroissance dérivée du temps
      // écoulé depuis la dernière trouvaille (palier de 5s, plancher à 1),
      // jamais affectée par une mauvaise saisie.
      let nextScore = score;
      if (mode === 'combo') {
        const elapsedSteps = comboBase == null ? 0 : Math.floor((now - (lastFindAt ?? now)) / 5000);
        const currentCombo = comboBase == null ? 1 : Math.max(1, comboBase - elapsedSteps);
        nextScore = score + currentCombo;
        setScore(nextScore);
        setComboBase(currentCombo + 1);
        setLastFindAt(now);
      }

      if (next.size === champions.length) {
        setEndTime(now);
        setCompleted(true);
        setEndReason('complete');
        const metric = mode === 'combo' ? nextScore
          : mode === 'timeattack' ? next.size
          : now - startedAt; // speedrun : temps
        const lower = mode === 'speedrun';
        const newRecord = best == null || (lower ? metric < best : metric > best);
        if (newRecord) {
          setBest(metric);
          try { localStorage.setItem(recKey, String(metric)); } catch { /* quota plein / navigation privée : best-effort */ }
        }
        setIsNewRecord(newRecord);
        modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
      }
    } else if (match) {
      // Déjà trouvé : pas une erreur — highlight rouge distinct de justfound
      // (qui reste réservé aux vraies nouvelles trouvailles) et du shake rouge.
      // On coupe court un justfound encore actif sur ce même nom (retype dans
      // les 900ms suivant la trouvaille) pour garantir l'exclusion mutuelle.
      setJustFoundName(prev => prev === match.name ? null : prev);
      setDuplicateName(match.name);
      setTimeout(() => setDuplicateName(prev => prev === match.name ? null : prev), 900);
      setQuery('');
      setFlash('duplicate');
      setTimeout(() => setFlash(null), 320);
    } else {
      setFlash('wrong');
      setShake(true);
      setTimeout(() => { setFlash(null); setShake(false); }, 360);
    }
  }, [query, found, startTime, endTime, champions, game, mode, best, recKey, score, comboBase, lastFindAt]);

  const handleGiveUp = useCallback(() => {
    // Garde : si la run s'est terminée pendant que la confirmation était
    // ouverte, ne pas réécrire une victoire en abandon.
    if (endTime != null) return;
    const now = Date.now();
    if (startTime == null) setStartTime(now);
    setEndTime(now);
    setCompleted(false);
    setEndReason('gaveup');
    setIsNewRecord(false);
    modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
  }, [startTime, endTime]);

  // Fin par compte à rebours épuisé (timeattack). Stable (ne dépend que de
  // recKey) : lit found/endTime/best via refs pour ne pas se re-créer à chaque
  // trouvaille (sinon l'effet onExpire de Timer se relancerait en boucle).
  const handleExpire = useCallback(() => {
    if (endTimeRef.current != null) return;
    const now = Date.now();
    setEndTime(now);
    setCompleted(false);
    setEndReason('expired');
    const count = foundRef.current.size;
    const prev = bestRef.current;
    const newRecord = prev == null || count > prev;
    if (newRecord) {
      setBest(count);
      try { localStorage.setItem(recKey, String(count)); } catch { /* best-effort */ }
    }
    setIsNewRecord(newRecord);
    modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
  }, [recKey]);

  const handleResetRecord = useCallback(() => {
    localStorage.removeItem(recKey);
    setBest(null);
  }, [recKey]);

  // Stable : ConfirmModal / CompleteModal dépendent de ces callbacks dans useDialogFocus.
  const closeConfirm = useCallback(() => setPendingConfirm(null), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const bestTimeDisplay = mode === 'speedrun' && best != null ? formatTime(best) : null;
  const bestLabelKey = mode === 'speedrun' ? 'scoreboard.bestTime'
    : mode === 'combo' ? 'scoreboard.bestScore' : 'scoreboard.bestCount';
  const bestValueText = mode === 'speedrun'
    ? (bestTimeDisplay ? bestTimeDisplay.mmss : '--:--')
    : best != null ? String(best) : '--';
  const countdownMs = mode === 'timeattack' ? taDuration * 60_000 : undefined;
  const pct = champions.length ? (found.size / champions.length) * 100 : 0;

  // Chargement des données : loader plein écran, le shell n'apparaît que prêt.
  if (loading) {
    return (
      <div className="page-loading" role="status">
        <div className="brand-mark" aria-hidden="true"><GameBadge game={game} letter={BRAND_MARK[game]} variant="black" /></div>
        {t('status.loading')}
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-head">
          <div className="brand">
            <div className="brand-mark"><GameBadge game={game} letter={BRAND_MARK[game]} variant="black" /></div>
            <div className="brand-text">RECALL</div>
          </div>
          <div className="rail-controls">
            <button className="lang-btn" onClick={onToggleLang} aria-label={`${lang === 'fr' ? 'EN' : 'FR'} - ${t('topbar.switchLanguage')}`}>
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <div className="menu-wrap" ref={menuRef}>
              <button ref={menuBtnRef} className="icon-btn" onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label={t('topbar.menu')}><DotsThree size={20} weight="bold" /></button>
              {menuOpen && (
                <div className="popover" role="menu">
                  <button role="menuitem" className="popover-item" onClick={() => { setMenuOpen(false); resetGame(); }}>{t('topbar.newRun')}</button>
                  <button role="menuitem" className="popover-item" onClick={() => { setMenuOpen(false); menuBtnRef.current?.focus(); setPendingConfirm('resetRecord'); }}>{t('topbar.resetRecord')}</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rail-game">
          <span className="rail-lbl">{t('sidebar.game')}</span>
          <div className="game-select" ref={gameRef}>
            <button ref={gameBtnRef} className="game-select-btn" onClick={() => setGameOpen(o => !o)} aria-haspopup="menu" aria-expanded={gameOpen}>
              <span className="game-select-mark"><GameBadge game={game} letter={BRAND_MARK[game]} variant="white" /></span>
              <span className="game-select-name">{GAME_LABELS[game]}</span>
              <CaretDown className="game-select-chev" size={13} weight="bold" aria-hidden="true" />
            </button>
            {gameOpen && (
              <div className="popover popover--full" role="menu">
                {(Object.keys(GAME_LABELS) as GameId[]).map(g => (
                  <button
                    key={g}
                    role="menuitem"
                    className={`popover-item${g === game ? ' current' : ''}`}
                    onClick={() => { setGameOpen(false); navigate(GAME_PATHS[g]); }}
                  >
                    <span className="game-select-mark"><GameBadge game={g} letter={BRAND_MARK[g]} variant="white" /></span>
                    {GAME_LABELS[g]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rail-mode">
          <span className="rail-lbl">{t('mode.label')}</span>
          <div className="mode-group" role="group" aria-label={t('mode.label')}>
            {GAME_MODES.map(m => (
              <button
                key={m}
                className={`mode-btn${m === mode ? ' current' : ''}`}
                aria-pressed={m === mode}
                onClick={() => onChangeMode(m)}
              >
                {t(`mode.${m}`)}
              </button>
            ))}
          </div>
          {mode === 'timeattack' && (
            <div className="ta-durations" role="group" aria-label={t('mode.duration')}>
              {TA_DURATIONS.map(d => (
                <button
                  key={d}
                  className={`ta-dur${d === taDuration ? ' current' : ''}`}
                  aria-pressed={d === taDuration}
                  onClick={() => onChangeDuration(d)}
                >
                  {t('mode.min', { count: d })}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stats">
          <div className="stat stat--progress">
            <span className="stat-lbl">{t('scoreboard.found')}</span>
            <span className="stat-big" aria-live="polite">
              {String(found.size).padStart(String(champions.length).length, '0')}<span className="stat-sep">/{champions.length}</span>
            </span>
            <div className="progress-track in-cell">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {mode === 'combo' && (
            <div className="stat">
              <span className="stat-lbl">{t('scoreboard.score')}</span>
              <div className="stat-score-row">
                <span className="stat-big" style={{ color: 'var(--gold-bright)' }}>{score}</span>
                <ComboRing comboBase={comboBase} lastFindAt={lastFindAt} />
              </div>
            </div>
          )}
          <div className="stat">
            <span className="stat-lbl">{t(bestLabelKey)}</span>
            <span className="stat-big" style={{ color: best != null ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
              {bestValueText}
            </span>
          </div>
        </div>

        {stale && <div className="stale-note">{t('data.stale')}</div>}
      </aside>

      <main className="main">
        <div className="main-top">
          <div className="timebar">
            <span className="timebar-lbl">{mode === 'timeattack' ? t('scoreboard.timeLeft') : t('scoreboard.timer')}</span>
            <Timer startTime={startTime} endTime={endTime} countdownMs={countdownMs} onExpire={handleExpire} />
          </div>
          <button className="giveup" onClick={() => setPendingConfirm('giveUp')} disabled={endTime != null || !champions.length}>
            <Flag className="giveup-flag" size={16} weight="bold" aria-hidden="true" />
            <span className="giveup-text">
              <strong>{t('status.giveUp')}</strong>
              <em>{t('status.giveUpSub')}</em>
            </span>
          </button>
        </div>

        <div className={['command-bar', shake ? 'shake' : '', flash === 'correct' ? 'flash-correct' : '', flash === 'wrong' ? 'flash-wrong' : '', flash === 'duplicate' ? 'flash-duplicate' : ''].filter(Boolean).join(' ')}>
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
          {lastFound && (
            <span className="last-found">{t('status.lastFound')} <span className="name">{lastFound}</span></span>
          )}
        </div>

        {error ? (
          <div className="load-error" role="alert">
            <p>{t('error.loadFailed')}</p>
            <button className="icon-btn" onClick={() => window.location.reload()}>{t('error.retry')}</button>
          </div>
        ) : (
          <ChampionGrid
            champions={champions}
            found={found}
            justFoundName={justFoundName}
            duplicateName={duplicateName}
            revealMissed={endTime != null && !completed}
          />
        )}
      </main>

      {pendingConfirm && (
        <ConfirmModal
          message={t(pendingConfirm === 'giveUp' ? 'confirm.giveUp' : 'confirm.resetRecord')}
          danger
          onConfirm={() => {
            const action = pendingConfirm === 'giveUp' ? handleGiveUp : handleResetRecord;
            setPendingConfirm(null);
            action();
          }}
          onCancel={closeConfirm}
        />
      )}

      {showModal && endTime != null && startTime != null && (
        <CompleteModal
          game={game}
          mode={mode}
          taDuration={taDuration}
          total={champions.length}
          found={found.size}
          endReason={endReason}
          lang={lang}
          time={endTime - startTime}
          score={score}
          best={best}
          isNewRecord={isNewRecord}
          onRestart={resetGame}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
