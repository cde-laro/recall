import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: string;
  disabled: boolean;
  flash: 'correct' | 'wrong' | null;
  shake: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

export function InputBar({ value, disabled, flash, shake, onChange, onSubmit }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const cls = [
    'input-bar',
    shake ? 'shake' : '',
    flash === 'correct' ? 'flash-correct' : '',
    flash === 'wrong' ? 'flash-wrong' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        disabled={disabled}
        placeholder={disabled ? t('input.placeholderDone') : t('input.placeholder')}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
      <button className="input-submit" disabled={disabled} onClick={onSubmit}>
        {t('input.submit')}
      </button>
    </div>
  );
}
