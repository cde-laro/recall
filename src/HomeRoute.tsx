import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { formatTime } from './utils/formatTime';
import { GameBadge } from './components/GameBadge';
import { PortraitMarquee } from './components/PortraitMarquee';
import { GAME_LABELS, GAME_PATHS, BRAND_MARK } from './gameMeta';
import type { GameId } from './hooks/useGameData';

const GAMES: GameId[] = ['lol', 'valorant', 'overwatch'];

function readBest(key: string): number | null {
  const raw = localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function HomeRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lang, setLang] = useState<'fr' | 'en'>(
    () => (localStorage.getItem('memochamp_lang') as 'fr' | 'en') ?? 'fr'
  );

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('memochamp_lang', lang);
  }, [lang]);

  // Game.tsx pose data-game/title/meta description sans jamais les nettoyer
  // au démontage. Le seul chemin réaliste pour revenir sur Home est le bouton
  // Retour du navigateur (pas de lien retour depuis une partie) : on
  // réinitialise donc ici, au montage de Home, plutôt que de compter sur un
  // cleanup côté Game — plus robuste, peu importe comment on est revenu ici.
  useEffect(() => {
    document.documentElement.removeAttribute('data-game');
    document.title = 'RECALL - Champion Identification Challenge';
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'A memory challenge: name every champion, agent, or hero from memory. League of Legends, Valorant, Overwatch.'
    );
  }, []);

  const toggleLang = useCallback(() => setLang(l => (l === 'fr' ? 'en' : 'fr')), []);

  return (
    <div className="home-page">
      <PortraitMarquee />
      <div className="home-scrim" />
      <div className="home-content">
        <div className="home-top">
          <div className="brand">
            <div className="brand-mark">R</div>
            <div className="brand-text">RECALL</div>
          </div>
          <button
            className="lang-btn home-lang"
            onClick={toggleLang}
            aria-label={`${lang === 'fr' ? 'EN' : 'FR'} - ${t('topbar.switchLanguage')}`}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
        <div className="home-tagline">{t('home.tagline')}</div>
        <div className="home-games">
          {GAMES.map(g => {
            const bestTime = readBest(`memochamp_best_${g}`);
            const bestScore = readBest(`memochamp_bestscore_${g}`);
            return (
              <button key={g} className="home-game" data-game={g} onClick={() => navigate(GAME_PATHS[g])}>
                <span className="home-game-icon">
                  <GameBadge game={g} letter={BRAND_MARK[g]} variant="white" />
                </span>
                <span className="home-game-name">{GAME_LABELS[g]}</span>
                <div className="home-game-best">
                  {bestTime != null && bestScore != null ? (
                    <>
                      <div>{t('scoreboard.bestTime')} <span className="gold">{formatTime(bestTime).mmss}</span></div>
                      <div>{t('modal.bestScore')} <span className="gold">{bestScore}</span></div>
                    </>
                  ) : t('home.notPlayed')}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
