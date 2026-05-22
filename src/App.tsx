import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useChampionData } from './hooks/useChampionData';
import { normalize } from './utils/normalize';
import { TopBar } from './components/TopBar';
import { Scoreboard } from './components/Scoreboard';
import { InputBar } from './components/InputBar';
import { ChampionGrid } from './components/ChampionGrid';
import { CompleteModal } from './components/CompleteModal';

export default function App() {
  const { t } = useTranslation();

  const [lang, setLang] = useState<'fr' | 'en'>(
    () => (localStorage.getItem('memochamp_lang') as 'fr' | 'en') ?? 'fr'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('memochamp_theme') as 'dark' | 'light') ?? 'dark'
  );
  const [found, setFound] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const raw = localStorage.getItem('memochamp_best');
    return raw ? Number(raw) : null;
  });
  const [showModal, setShowModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [justFoundName, setJustFoundName] = useState<string | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  const [lastFound, setLastFound] = useState<string | null>(null);

  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const { version, champions, loading } = useChampionData(lang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('memochamp_theme', theme);
  }, [theme]);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const onScroll = () => el.classList.toggle('is-compact', window.scrollY >= 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (modalTimerRef.current != null) clearTimeout(modalTimerRef.current);
    i18n.changeLanguage(lang);
    localStorage.setItem('memochamp_lang', lang);
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setShowModal(false);
    setIsNewRecord(false);
    setJustFoundName(null);
    setLastFound(null);
  }, [lang]);

  useEffect(() => {
    if (startTime == null || endTime != null) return;
    const id = setInterval(() => setNow(Date.now()), 30);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const resetGame = useCallback(() => {
    if (modalTimerRef.current != null) clearTimeout(modalTimerRef.current);
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setShowModal(false);
    setIsNewRecord(false);
    setJustFoundName(null);
    setLastFound(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (endTime != null || !champions.length) return;
    const norm = normalize(query);
    if (!norm) return;

    const match = champions.find(c => normalize(c.name) === norm);
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
        const elapsed = finishedAt - startedAt;
        const newRecord = bestTime == null || elapsed < bestTime;
        if (newRecord) {
          setBestTime(elapsed);
          localStorage.setItem('memochamp_best', String(elapsed));
        }
        setIsNewRecord(newRecord);
        modalTimerRef.current = setTimeout(() => setShowModal(true), 500);
      }
    } else {
      setFlash('wrong');
      setShake(true);
      setTimeout(() => { setFlash(null); setShake(false); }, 360);
    }
  }, [query, found, startTime, endTime, champions, bestTime]);

  const handleGiveUp = useCallback(() => {
    if (!confirm(t('confirm.giveUp'))) return;
    const now = Date.now();
    setFound(new Set(champions.map(c => c.name)));
    if (startTime == null) setStartTime(now);
    setEndTime(now);
  }, [champions, startTime, t]);

  const handleResetRecord = useCallback(() => {
    if (!confirm(t('confirm.resetRecord'))) return;
    localStorage.removeItem('memochamp_best');
    setBestTime(null);
  }, [t]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const toggleLang = useCallback(() => {
    setLang(l => l === 'fr' ? 'en' : 'fr');
  }, []);

  return (
    <div className="app">
      <TopBar
        version={version}
        theme={theme}
        lang={lang}
        onToggleTheme={toggleTheme}
        onToggleLang={toggleLang}
        onNewRun={resetGame}
        onResetRecord={handleResetRecord}
      />

      <div className="sticky-zone" ref={stickyRef}>
        {/* Bloc complet */}
        <div className="hud-full">
          <Scoreboard
            foundCount={found.size}
            total={champions.length}
            startTime={startTime}
            endTime={endTime}
            now={now}
            bestTime={bestTime}
          />
          <InputBar
            value={query}
            disabled={endTime != null || loading}
            flash={flash}
            shake={shake}
            onChange={setQuery}
            onSubmit={handleSubmit}
          />
          <div className="status-row">
            <div>
              {lastFound ? (
                <span className="last-found">
                  {t('status.lastFound')} <span className="name">{lastFound}</span>
                </span>
              ) : (
                <span>{t('status.hint')}</span>
              )}
            </div>
            <div className="controls">
              <button className="icon-btn" onClick={handleGiveUp} disabled={endTime != null}>
                {t('status.giveUp')}
              </button>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${champions.length ? (found.size / champions.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Bloc compact */}
        <div className="hud-compact">
          <div className={[
            'compact-line',
            shake ? 'shake' : '',
            flash === 'correct' ? 'flash-correct' : '',
            flash === 'wrong' ? 'flash-wrong' : '',
          ].filter(Boolean).join(' ')}>
            <div className="compact-found">
              <span className="compact-lbl">{t('scoreboard.found')}</span>
              <span className="compact-num">{String(found.size).padStart(3, '0')}<span className="compact-total">/{champions.length}</span></span>
            </div>
            <div className="compact-timer">
              <span className="compact-t">{(() => { const elapsed = endTime != null ? endTime - (startTime ?? endTime) : startTime != null ? now - startTime : 0; const s = Math.floor(elapsed / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; })()}</span>
              <span className="compact-ms">.{String(Math.floor(((endTime != null ? endTime - (startTime ?? endTime) : startTime != null ? now - startTime : 0) % 1000) / 10)).padStart(2, '0')}</span>
            </div>
            <input
              autoFocus
              value={query}
              disabled={endTime != null || loading}
              placeholder={endTime != null ? t('input.placeholderDone') : t('input.placeholder')}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            <button className="compact-submit" disabled={endTime != null || loading} onClick={handleSubmit}>
              {t('input.submit')}
            </button>
            <div className="compact-best">
              <span className="compact-lbl">{t('scoreboard.bestTime')}</span>
              <span className="compact-num" style={{ color: bestTime != null ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
                {bestTime != null ? (() => { const s = Math.floor(bestTime / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; })() : '--:--'}
              </span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${champions.length ? (found.size / champions.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
          // Loading champions…
        </div>
      ) : (
        <ChampionGrid
          champions={champions}
          version={version}
          found={found}
          justFoundName={justFoundName}
        />
      )}

      {showModal && endTime != null && startTime != null && (
        <CompleteModal
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
