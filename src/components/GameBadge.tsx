import type { GameId } from '../hooks/useGameData';

interface Props {
  game: GameId;
  letter: string;
  variant: 'black' | 'white';
}

type LogoEntry = { black: string; white: string } | { universal: string };

// vite.config.ts pose un `base` absolu (assets servis depuis
// recall-cde.vercel.app même quand la page est chargée depuis
// cde-laro.dev/recall/...). Un chemin codé en dur commençant par `/` (ex.
// "/logos/lol-black.svg") est résolu par le navigateur depuis la racine du
// domaine COURANT (cde-laro.dev), pas depuis /recall/ ni depuis le
// déploiement Vercel — en prod ça atterrit sur le portfolio à la racine et
// 404. `import.meta.env.BASE_URL` reflète ce même `base` : on l'utilise pour
// obtenir une URL absolue correcte dans tous les contextes (dev, prod via
// cde-laro.dev, prod via recall-cde.vercel.app direct), comme le fait déjà
// Vite lui-même pour le favicon/les bundles JS dans index.html.
const LOGO_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Logos de marque (officiels pour LoL/Overwatch, reconstitution vectorielle
// communautaire pour Valorant faute de SVG officiel — cf.
// public/logos/README.md). `black` sert sur fond clair/dégradé
// (.brand-mark), `white` sur fond sombre/translucide (.game-select-mark).
// `universal` sert tel quel dans les deux contextes (logo déjà bicolore, se
// lit bien sur les deux fonds).
const LOGOS: Partial<Record<GameId, LogoEntry>> = {
  lol: { black: `${LOGO_BASE}/logos/lol-black.svg`, white: `${LOGO_BASE}/logos/lol-white.svg` },
  valorant: { black: `${LOGO_BASE}/logos/valorant-black.svg`, white: `${LOGO_BASE}/logos/valorant-white.svg` },
  overwatch: { universal: `${LOGO_BASE}/logos/overwatch.svg` },
};

export function GameBadge({ game, letter, variant }: Props) {
  const logo = LOGOS[game];
  if (!logo) return <>{letter}</>;
  const src = 'universal' in logo ? logo.universal : logo[variant];
  return <img className="brand-logo" src={src} alt="" />;
}
