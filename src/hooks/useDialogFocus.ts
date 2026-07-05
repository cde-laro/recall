import { useEffect, type RefObject } from 'react';

// Comportement modal partagé (ConfirmModal, CompleteModal) : focus initial
// imposé, Tab piégé dans la boîte, Escape déclenche onDismiss, focus restitué
// à la fermeture (avec repli si la cible d'origine a disparu ou est désactivée).
// `onDismiss` doit être stable (useCallback) : l'effet en dépend.
export function useDialogFocus<D extends HTMLElement, F extends HTMLElement>(
  dialogRef: RefObject<D | null>,
  initialFocusRef: RefObject<F | null>,
  onDismiss: () => void
) {
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    initialFocusRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      if (e.key === 'Tab') {
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
      if (previousFocus?.isConnected && !(previousFocus as HTMLButtonElement).disabled) previousFocus.focus?.();
    };
  }, [dialogRef, initialFocusRef, onDismiss]);
}
