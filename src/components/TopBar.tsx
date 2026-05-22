import { useTranslation } from 'react-i18next';

interface Props {
  version: string;
  theme: 'dark' | 'light';
  lang: 'fr' | 'en';
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onNewRun: () => void;
  onResetRecord: () => void;
}

export function TopBar({ version, theme, lang, onToggleTheme, onToggleLang, onNewRun, onResetRecord }: Props) {
  const { t } = useTranslation();

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-text">Memo<span className="accent">.Champ</span></div>
          <div className="brand-sub">// Champion identification trial</div>
        </div>
      </div>

      {version && (
        <span className="season-chip">
          {t('topbar.season')} · {t('topbar.patch', { version })}
        </span>
      )}

      <div className="topbar-right">
        <button className="icon-btn" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn" onClick={onNewRun}>
          {t('topbar.newRun')}
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
