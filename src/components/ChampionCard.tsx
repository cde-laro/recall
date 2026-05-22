import type { Champion } from '../hooks/useChampionData';

interface Props {
  champion: Champion;
  version: string;
  index: number;
  found: boolean;
  justFound: boolean;
}

export function ChampionCard({ champion, version, index, found, justFound }: Props) {
  const cls = ['card', found ? 'found' : '', justFound ? 'justfound' : '']
    .filter(Boolean).join(' ');

  const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;

  return (
    <div className={cls}>
      <span className="num">#{String(index + 1).padStart(3, '0')}</span>
      <div className="portrait">
        {found
          ? <img src={imgUrl} alt={champion.name} loading="lazy" />
          : <span className="question">?</span>
        }
      </div>
      <div className="name-bar">
        {found ? champion.name : '—— LOCKED ——'}
      </div>
    </div>
  );
}
