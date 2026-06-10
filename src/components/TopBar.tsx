import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { GameId as Game } from '../hooks/useGameData';

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
  lol: 'L',
  valorant: 'V',
  overwatch: 'O',
};

const BRAND_GAME: Record<Game, string> = {
  lol: 'League',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
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
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, menuOpen]);

  const chipLabel = game === 'lol'
    ? (version ? `${t('topbar.season')} · ${t('topbar.patch', { version })}` : '')
    : SEASON_CHIP[game];

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">{BRAND_MARK[game]}</div>
        <div>
          <div className="brand-text">RECALL<span className="accent">/{BRAND_GAME[game]}</span></div>
        </div>
      </div>

      <span className="season-chip">{chipLabel}</span>

      <div className="topbar-right">
        {/* Desktop-only text controls */}
        <button className="icon-btn desktop-only" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn desktop-only" onClick={onNewRun}>
          {t('topbar.newRun')}
        </button>

        <div className="game-dropdown" ref={dropdownRef}>
          <button
            className="game-btn active"
            onClick={() => setOpen(o => !o)}
            aria-label={t('topbar.switchGame')}
            aria-haspopup="menu"
            aria-expanded={open}
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

        <button className="theme-btn" onClick={onToggleTheme} aria-label={t('topbar.toggleTheme')}>
          <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
        <button className="lang-btn" onClick={onToggleLang} aria-label={t('topbar.switchLanguage')}>
          <span aria-hidden="true">{lang === 'fr' ? '🇬🇧' : '🇫🇷'}</span>
        </button>

        {/* Mobile-only burger menu */}
        <div className="burger-dropdown" ref={menuRef}>
          <button
            className="burger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="burger-menu">
              <button className="burger-menu-item" onClick={() => { setMenuOpen(false); onNewRun(); }}>
                {t('topbar.newRun')}
              </button>
              <button className="burger-menu-item" onClick={() => { setMenuOpen(false); onResetRecord(); }}>
                {t('topbar.resetRecord')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
