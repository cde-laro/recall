import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Character } from '../hooks/useGameData';

interface Props {
  champion: Character;
  index: number;
  found: boolean;
  justFound: boolean;
}

export const ChampionCard = memo(function ChampionCard({ champion, index, found, justFound }: Props) {
  const { t } = useTranslation();
  const cls = ['card', found ? 'found' : '', justFound ? 'justfound' : '']
    .filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <span className="num">#{String(index + 1).padStart(3, '0')}</span>
      <div className="portrait">
        {found
          ? <img src={champion.imageUrl} alt={champion.name} loading="lazy" />
          : <span className="question">?</span>
        }
      </div>
      <div className="name-bar">
        {found ? champion.name : `—— ${t('card.locked')} ——`}
      </div>
    </div>
  );
});
