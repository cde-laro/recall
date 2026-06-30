import { memo } from 'react';
import type { Character } from '../hooks/useGameData';

interface Props {
  champion: Character;
  found: boolean;
  justFound: boolean;
}

export const ChampionCard = memo(function ChampionCard({ champion, found, justFound }: Props) {
  const cls = ['card', found ? 'found' : 'locked', justFound ? 'justfound' : '']
    .filter(Boolean).join(' ');

  if (!found) {
    return (
      <div className={cls}>
        <svg className="lock-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <circle cx="12" cy="8.2" r="4.1" />
          <path d="M3.8 20.5c0-4.3 3.7-6.8 8.2-6.8s8.2 2.5 8.2 6.8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cls}>
      <div className="portrait">
        <img src={champion.imageUrl} alt={champion.name} loading="lazy" />
      </div>
      <div className="name-bar">{champion.name}</div>
    </div>
  );
});
