import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Remplace window.confirm : Escape / clic backdrop = annuler,
// focus initial sur Annuler, focus restitué à la fermeture.
export function ConfirmModal({ message, danger, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (previousFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-message"
        onClick={e => e.stopPropagation()}
      >
        <p id="confirm-message" className="confirm-message">{message}</p>
        <div className="actions">
          <button ref={cancelRef} className="secondary" onClick={onCancel}>{t('confirm.cancel')}</button>
          <button className={danger ? 'danger' : ''} onClick={onConfirm}>{t('confirm.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
