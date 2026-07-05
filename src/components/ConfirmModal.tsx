import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface Props {
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Remplace window.confirm : Escape / clic backdrop = annuler, focus initial
// sur Annuler. `onCancel` doit être stable (useCallback) : useDialogFocus en dépend.
export function ConfirmModal({ message, danger, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useDialogFocus(dialogRef, cancelRef, onCancel);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-message"
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
