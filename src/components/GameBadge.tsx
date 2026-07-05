import type { GameId } from '../hooks/useGameData';

interface Props {
  game: GameId;
  letter: string;
  variant: 'black' | 'white';
}

type LogoEntry = { black: string; white: string } | { universal: string };

// Logos de marque (officiels pour LoL/Overwatch, reconstitution vectorielle
// communautaire pour Valorant faute de SVG officiel — cf.
// public/logos/README.md). `black` sert sur fond clair/dégradé
// (.brand-mark), `white` sur fond sombre/translucide (.game-select-mark).
// `universal` sert tel quel dans les deux contextes (logo déjà bicolore, se
// lit bien sur les deux fonds).
const LOGOS: Partial<Record<GameId, LogoEntry>> = {
  lol: { black: '/logos/lol-black.svg', white: '/logos/lol-white.svg' },
  valorant: { black: '/logos/valorant-black.svg', white: '/logos/valorant-white.svg' },
  overwatch: { universal: '/logos/overwatch.svg' },
};

export function GameBadge({ game, letter, variant }: Props) {
  const logo = LOGOS[game];
  if (!logo) return <>{letter}</>;
  const src = 'universal' in logo ? logo.universal : logo[variant];
  return <img className="brand-logo" src={src} alt="" />;
}
