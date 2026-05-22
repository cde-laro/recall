import type { Champion } from '../hooks/useChampionData';
import { ChampionCard } from './ChampionCard';

interface Props {
  champions: Champion[];
  version: string;
  found: Set<string>;
  justFoundName: string | null;
}

export function ChampionGrid({ champions, version, found, justFoundName }: Props) {
  return (
    <div className="grid">
      {champions.map((champ, i) => (
        <ChampionCard
          key={champ.id}
          champion={champ}
          version={version}
          index={i}
          found={found.has(champ.name)}
          justFound={justFoundName === champ.name}
        />
      ))}
    </div>
  );
}
