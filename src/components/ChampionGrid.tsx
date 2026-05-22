import type { Character } from '../hooks/useGameData';
import { ChampionCard } from './ChampionCard';

interface Props {
  champions: Character[];
  found: Set<string>;
  justFoundName: string | null;
}

export function ChampionGrid({ champions, found, justFoundName }: Props) {
  return (
    <div className="grid">
      {champions.map((champ, i) => (
        <ChampionCard
          key={champ.id}
          champion={champ}
          index={i}
          found={found.has(champ.name)}
          justFound={justFoundName === champ.name}
        />
      ))}
    </div>
  );
}
