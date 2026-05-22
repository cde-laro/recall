import { useTranslation } from 'react-i18next';

interface Props {
  version: string;
  theme: 'dark' | 'light';
  lang: 'fr' | 'en';
  game: 'lol' | 'valorant';
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onToggleGame: () => void;
  onNewRun: () => void;
  onResetRecord: () => void;
}

const ValLogo = () => (
  <svg width="16" height="13" viewBox="0 0 22 18" fill="currentColor" aria-hidden>
    <path d="M0 0 L5 0 L11 10 L17 0 L22 0 L11 18Z" />
    <path d="M6.5 0 L11 7.5 L15.5 0 L17 0 L11 10 L5 0Z" opacity="0.4" />
  </svg>
);

export function TopBar({ version, theme, lang, game, onToggleTheme, onToggleLang, onToggleGame, onNewRun, onResetRecord }: Props) {
  const { t } = useTranslation();
  const isVal = game === 'valorant';

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">{isVal ? 'V' : 'M'}</div>
        <div>
          <div className="brand-text">
            Memo<span className="accent">{isVal ? '.Agent' : '.Champ'}</span>
          </div>
          <div className="brand-sub">
            {isVal ? '// Agent identification trial' : '// Champion identification trial'}
          </div>
        </div>
      </div>

      <span className="season-chip">
        {isVal
          ? 'Valorant'
          : version
            ? `${t('topbar.season')} · ${t('topbar.patch', { version })}`
            : ''}
      </span>

      <div className="topbar-right">
        <button className="icon-btn" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn" onClick={onNewRun}>
          {t('topbar.newRun')}
        </button>
        <button
          className={`game-btn${isVal ? ' active' : ''}`}
          onClick={onToggleGame}
          title={isVal ? 'Switch to League of Legends' : 'Switch to Valorant'}
        >
          <ValLogo />
        </button>
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
