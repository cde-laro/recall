import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';

interface Props {
  time: number;
  bestTime: number | null;
  isNewRecord: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export function CompleteModal({ time, bestTime, isNewRecord, onRestart, onClose }: Props) {
  const { t } = useTranslation();
  const current = formatTime(time);
  const best = bestTime != null ? formatTime(bestTime) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isNewRecord ? t('modal.newRecord') : t('modal.complete')}</h2>
        <div className="sub">
          {isNewRecord ? t('modal.subNewRecord') : t('modal.subComplete')}
        </div>
        <div className="stats">
          <div>
            <div className="stat-label">{t('modal.finalTime')}</div>
            <div className="stat-value gold">
              {current.mmss}
              <span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>.{current.cs}</span>
            </div>
          </div>
          <div>
            <div className="stat-label">{t('modal.bestTime')}</div>
            <div className="stat-value">
              {best ? best.mmss : '--:--'}
              <span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>
                {best ? `.${best.cs}` : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="actions">
          <button onClick={onRestart}>{t('modal.replay')}</button>
          <button className="secondary" onClick={onClose}>{t('modal.viewGrid')}</button>
        </div>
      </div>
    </div>
  );
}
