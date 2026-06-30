import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';
import { buildShareText } from '../utils/shareText';
import type { GameId } from '../hooks/useGameData';

interface Props {
  game: GameId;
  total: number;
  found: number;
  completed: boolean;
  lang: 'fr' | 'en';
  time: number;
  bestTime: number | null;
  isNewRecord: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export function CompleteModal({ game, total, found, completed, lang, time, bestTime, isNewRecord, onRestart, onClose }: Props) {
  const { t } = useTranslation();
  const current = formatTime(time);
  const best = bestTime != null ? formatTime(bestTime) : null;

  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const record = completed && isNewRecord;
  const shareText = buildShareText({ game, found, total, timeMs: time, isNewRecord: record, lang });

  function handleCopy() {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      if (copiedTimerRef.current != null) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  useEffect(() => () => {
    if (copiedTimerRef.current != null) clearTimeout(copiedTimerRef.current);
  }, []);

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
        <h2 id="modal-title">
          {completed ? (record ? t('modal.newRecord') : t('modal.complete')) : t('modal.gaveUp')}
        </h2>
        <div className="sub">
          {completed
            ? (record ? t('modal.subNewRecord') : t('modal.subComplete'))
            : t('modal.subGaveUp', { found, total })}
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
        <div className="actions share-actions">
          <button className="secondary" onClick={handleShare}>{t('modal.share')}</button>
          <button className="secondary" onClick={handleCopy} aria-live="polite">
            {copied ? t('modal.copied') : t('modal.copyScore')}
          </button>
        </div>
      </div>
    </div>
  );
}
