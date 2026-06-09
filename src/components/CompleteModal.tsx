import { useEffect, useRef } from 'react';
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

  const restartRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    restartRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (previousFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title">{isNewRecord ? t('modal.newRecord') : t('modal.complete')}</h2>
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
          <button ref={restartRef} onClick={onRestart}>{t('modal.replay')}</button>
          <button className="secondary" onClick={onClose}>{t('modal.viewGrid')}</button>
        </div>
      </div>
    </div>
  );
}
