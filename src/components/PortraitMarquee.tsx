import { useState } from 'react';
import lolData from '../data/lol.fr.json';
import valorantData from '../data/valorant.fr.json';
import overwatchData from '../data/overwatch.fr.json';

const ROWS = 6;
const PORTRAITS_PER_ROW = 14;

// Seul `imageUrl` est utilisé (jamais le nom) : peu importe que ces snapshots
// soient en FR, purement décoratif. Zéro appel réseau — ces fichiers sont
// déjà bundlés au build (même snapshots que le fallback de useGameData.ts).
const ALL_PORTRAITS: string[] = [
  ...lolData.characters,
  ...valorantData.characters,
  ...overwatchData.characters,
].map(c => c.imageUrl);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRows(): string[][] {
  return Array.from({ length: ROWS }, () => {
    const picks = shuffle(ALL_PORTRAITS).slice(0, PORTRAITS_PER_ROW);
    // Dupliquée à la suite d'elle-même : permet à l'animation CSS de boucler
    // sur exactement 50% de la largeur sans à-coup.
    return [...picks, ...picks];
  });
}

// Décor purement visuel : aria-hidden, jamais dans l'ordre de tabulation.
// Le mélange aléatoire est calculé une seule fois (état paresseux), jamais
// recalculé à chaque render — sinon les images sauteraient et la boucle
// perdrait sa continuité visuelle.
export function PortraitMarquee() {
  const [rows] = useState(buildRows);

  return (
    <div className="portrait-marquee" aria-hidden="true">
      {rows.map((row, i) => (
        <div key={i} className={`marquee-row${i % 2 === 1 ? ' marquee-row--reverse' : ''}`}>
          {row.map((src, j) => (
            <img key={j} src={src} alt="" loading="lazy" />
          ))}
        </div>
      ))}
    </div>
  );
}
