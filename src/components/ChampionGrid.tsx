import { memo } from 'react';
import type { Character } from '../hooks/useGameData';
import { ChampionCard } from './ChampionCard';

interface Props {
  champions: Character[];
  found: Set<string>;
  justFoundName: string | null;
}

export const ChampionGrid = memo(function ChampionGrid({ champions, found, justFoundName }: Props) {
  return (
    <div className="grid">
      {champions.map(champ => (
        <ChampionCard
          key={champ.id}
          champion={champ}
          found={found.has(champ.name)}
          justFound={justFoundName === champ.name}
        />
      ))}
    </div>
  );
});
