import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';

interface Props {
  foundCount: number;
  total: number;
  startTime: number | null;
  endTime: number | null;
  now: number;
  bestTime: number | null;
}

export function Scoreboard({ foundCount, total, startTime, endTime, now, bestTime }: Props) {
  const { t } = useTranslation();

  const elapsed = endTime != null
    ? endTime - (startTime ?? endTime)
    : startTime != null
      ? now - startTime
      : 0;

  const isLive = startTime != null && endTime == null;
  const current = formatTime(elapsed);
  const best = bestTime != null ? formatTime(bestTime) : null;

  const timerLabel = endTime != null
    ? t('scoreboard.finished')
    : isLive
      ? t('scoreboard.live')
      : t('scoreboard.ready');

  return (
    <div className="scoreboard">
      <div className="score-side">
        <span className="score-label">{t('scoreboard.found')}</span>
        <span className="score-value">
          {String(foundCount).padStart(3, '0')}
          <span className="small">/ {total}</span>
        </span>
      </div>

      <div className="timer-shell">
        <span className="timer-label">{timerLabel}</span>
        <span className={`timer-value${isLive ? ' live' : ''}`}>
          {current.mmss}
          <span className="ms">.{current.cs}</span>
        </span>
      </div>

      <div className="score-side right">
        <span className="score-label">{t('scoreboard.bestTime')}</span>
        <span className="score-value" style={{ color: best ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
          {best ? best.mmss : '--:--'}
          <span className="small">{best ? `.${best.cs}` : ''}</span>
        </span>
      </div>
    </div>
  );
}
