import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type Game = 'lol' | 'valorant' | 'overwatch';

interface Props {
  version: string;
  theme: 'dark' | 'light';
  lang: 'fr' | 'en';
  game: Game;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onNewRun: () => void;
  onResetRecord: () => void;
}

const GAME_LABELS: Record<Game, string> = {
  lol: 'League',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

const GAME_PATHS: Record<Game, string> = {
  lol: '/league',
  valorant: '/valorant',
  overwatch: '/overwatch',
};

const BRAND_MARK: Record<Game, string> = {
  lol: 'M',
  valorant: 'V',
  overwatch: 'O',
};

const BRAND_SUB: Record<Game, string> = {
  lol: '// Champion identification trial',
  valorant: '// Agent identification trial',
  overwatch: '// Hero identification trial',
};

const SEASON_CHIP: Record<Game, string> = {
  lol: '',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

export function TopBar({ version, theme, lang, game, onToggleTheme, onToggleLang, onNewRun, onResetRecord }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const chipLabel = game === 'lol'
    ? (version ? `${t('topbar.season')} · ${t('topbar.patch', { version })}` : '')
    : SEASON_CHIP[game];

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">{BRAND_MARK[game]}</div>
        <div>
          <div className="brand-text">cde-laro<span className="accent">.dev</span></div>
          <div className="brand-sub">{BRAND_SUB[game]}</div>
        </div>
      </div>

      <span className="season-chip">{chipLabel}</span>

      <div className="topbar-right">
        <button className="icon-btn" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn" onClick={onNewRun}>
          {t('topbar.newRun')}
        </button>

        <div className="game-dropdown" ref={dropdownRef}>
          <button
            className="game-btn active"
            onClick={() => setOpen(o => !o)}
            title="Switch game"
          >
            {BRAND_MARK[game]}
          </button>
          {open && (
            <div className="game-menu">
              {(Object.keys(GAME_LABELS) as Game[]).map(g => (
                <button
                  key={g}
                  className={`game-menu-item${g === game ? ' current' : ''}`}
                  onClick={() => { setOpen(false); navigate(GAME_PATHS[g]); }}
                >
                  <span className="game-menu-mark">{BRAND_MARK[g]}</span>
                  {GAME_LABELS[g]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="theme-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="lang-btn" onClick={onToggleLang} title="Switch language">
          {lang === 'fr' ? '🇬🇧' : '🇫🇷'}
        </button>
      </div>
    </div>
  );
}
