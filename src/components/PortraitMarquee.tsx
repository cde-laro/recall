import { useEffect, useState } from 'react';

const ROWS = 6;
const PORTRAITS_PER_ROW = 14;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRows(portraits: string[]): string[][] {
  return Array.from({ length: ROWS }, () => {
    const picks = shuffle(portraits).slice(0, PORTRAITS_PER_ROW);
    // Dupliquée à la suite d'elle-même : permet à l'animation CSS de boucler
    // sur exactement 50% de la largeur sans à-coup.
    return [...picks, ...picks];
  });
}

// Décor purement visuel : aria-hidden, jamais dans l'ordre de tabulation.
// Chargement dynamique (comme le fallback de useGameData.ts) plutôt qu'un
// import statique, pour ne pas alourdir le bundle principal ni casser le
// découpage en chunks paresseux déjà en place pour ces mêmes snapshots.
// Le mélange aléatoire n'est calculé qu'une fois les données chargées,
// jamais recalculé ensuite (effet à dépendances vides).
export function PortraitMarquee() {
  const [rows, setRows] = useState<string[][]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('../data/lol.fr.json'),
      import('../data/valorant.fr.json'),
      import('../data/overwatch.fr.json'),
    ]).then(([lol, valorant, overwatch]) => {
      if (cancelled) return;
      const portraits = [
        ...lol.default.characters,
        ...valorant.default.characters,
        ...overwatch.default.characters,
      ].map(c => c.imageUrl);
      setRows(buildRows(portraits));
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="portrait-marquee" aria-hidden="true">
      {rows.map((row, i) => (
        <div
          key={i}
          className={`marquee-row${i % 2 === 1 ? ' marquee-row--reverse' : ''}`}
          style={{ animationDuration: `${36 + i * 2}s` }}
        >
          {row.map((src, j) => (
            <img key={j} src={src} alt="" loading="lazy" />
          ))}
        </div>
      ))}
    </div>
  );
}
