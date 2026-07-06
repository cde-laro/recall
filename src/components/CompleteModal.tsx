import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';
import { buildShareText } from '../utils/shareText';
import { useDialogFocus } from '../hooks/useDialogFocus';
import type { GameId } from '../hooks/useGameData';
import type { GameMode, TaDuration } from '../gameMeta';

interface Props {
  game: GameId;
  mode: GameMode;
  taDuration: TaDuration;
  total: number;
  found: number;
  endReason: 'complete' | 'expired' | 'gaveup' | null;
  lang: 'fr' | 'en';
  time: number;
  score: number;
  best: number | null;
  isNewRecord: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export function CompleteModal({ game, mode, taDuration, total, found, endReason, lang, time, score, best, isNewRecord, onRestart, onClose }: Props) {
  const { t } = useTranslation();
  const current = formatTime(time);
  const bestTimeFmt = best != null ? formatTime(best) : null;

  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);

  const record = isNewRecord;
  const shareText = buildShareText({ game, mode, found, total, timeMs: time, score, taDuration, isNewRecord: record, lang });

  // Titre selon la fin.
  const title = endReason === 'gaveup' ? t('modal.gaveUp')
    : endReason === 'expired' ? t('modal.timeUp')
    : record ? (mode === 'timeattack' ? t('modal.allFound') : t('modal.newRecord'))
    : (mode === 'timeattack' ? t('modal.allFound') : t('modal.complete'));

  // Sous-titre selon la fin + mode.
  const recordSubKey = mode === 'speedrun' ? 'modal.subNewRecordTime'
    : mode === 'combo' ? 'modal.subNewRecordScore' : 'modal.subNewRecordCount';
  const sub = endReason === 'gaveup' ? t('modal.subGaveUp', { found, total })
    : endReason === 'expired' ? (record ? t('modal.subNewRecordCount') : t('modal.subTimeUp', { found, total }))
    : record ? t(recordSubKey) : t('modal.subComplete');

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

  useDialogFocus(dialogRef, restartRef, onClose);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        <div className="sub">{sub}</div>
        <div className="stats">
          {mode === 'speedrun' && (
            <>
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
                  {bestTimeFmt ? bestTimeFmt.mmss : '--:--'}
                  <span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>
                    {bestTimeFmt ? `.${bestTimeFmt.cs}` : ''}
                  </span>
                </div>
              </div>
            </>
          )}
          {mode === 'combo' && (
            <>
              <div>
                <div className="stat-label">{t('modal.score')}</div>
                <div className="stat-value gold">{score}</div>
              </div>
              <div>
                <div className="stat-label">{t('modal.bestScore')}</div>
                <div className="stat-value">{best ?? '--'}</div>
              </div>
            </>
          )}
          {mode === 'timeattack' && (
            <>
              <div>
                <div className="stat-label">{t('modal.foundCount')}</div>
                <div className="stat-value gold">{found}<span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>/{total}</span></div>
              </div>
              <div>
                <div className="stat-label">{t('modal.bestCount')}</div>
                <div className="stat-value">{best ?? '--'}</div>
              </div>
            </>
          )}
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
