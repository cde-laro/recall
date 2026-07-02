import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Remplace window.confirm : Escape / clic backdrop = annuler, focus initial
// sur Annuler, Tab piégé dans la modale, focus restitué à la fermeture
// (avec repli si la cible d'origine a disparu ou est désactivée).
// `onCancel` doit être stable (useCallback) : l'effet en dépend.
export function ConfirmModal({ message, danger, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        // Piège à focus : boucle sur les boutons de la modale.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!dialogRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const prev = previousFocus.current as HTMLElement | null;
      // Ne restituer le focus que vers une cible encore vivante et focusable
      // (le bouton Abandonner devient disabled après confirmation).
      if (prev?.isConnected && !(prev as HTMLButtonElement).disabled) prev.focus?.();
    };
  }, [onCancel]);

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
