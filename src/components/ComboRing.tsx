import { useEffect, useState } from 'react';

interface Props {
  comboBase: number | null;
  lastFindAt: number | null;
}

const DECAY_MS = 5000;

// L'anneau ne s'affiche que tant qu'un bonus est actif (combo > x1) — pas
// d'état « idle » : avant toute trouvaille, ou une fois le combo redescendu
// au plancher de 1, le composant rend `null`. Le remplissage est une
// animation CSS pure — voir .combo-ring-fill dans index.css — remontée via
// `key={`${lastFindAt}-${elapsedSteps}`}` pour repartir de 100% à chaque
// trouvaille ET à chaque palier de 5s (sinon l'anneau ne redémarre qu'une
// fois puis reste vide indéfiniment) : aucun tick JS pour le visuel
// lui-même, juste ce remount. Seul le chiffre affiché est recalculé :
// `elapsedSteps` (nombre de paliers de 5s écoulés depuis la dernière
// trouvaille) est stocké en state et n'avance que via une chaîne de
// setTimeout auto-reprogrammée (jamais un setInterval qui poll, jamais plus
// d'un timer actif) — cet effet de planification tourne indépendamment du
// rendu (null ou non) pour que `elapsedSteps` continue d'être prêt si une
// nouvelle trouvaille fait remonter le combo au-dessus de 1. `Date.now()`
// n'est lu que dans l'effet — jamais pendant le rendu, qui doit rester une
// fonction pure (règle react-hooks/purity) — le rendu se contente
// d'arithmétique sur du state/des props. La remise à zéro d'`elapsedSteps`
// sur une nouvelle trouvaille suit le pattern React officiel « ajuster du
// state pendant le rendu quand une prop change » (comparaison à
// `prevFindAt`), plutôt qu'un `setState` synchrone dans l'effet (règle
// react-hooks/set-state-in-effect).
export function ComboRing({ comboBase, lastFindAt }: Props) {
  const [prevFindAt, setPrevFindAt] = useState(lastFindAt);
  const [elapsedSteps, setElapsedSteps] = useState(0);

  if (lastFindAt !== prevFindAt) {
    setPrevFindAt(lastFindAt);
    setElapsedSteps(0);
  }

  useEffect(() => {
    if (comboBase == null || lastFindAt == null) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const elapsedInStep = (Date.now() - lastFindAt) % DECAY_MS;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setElapsedSteps(s => s + 1);
        scheduleNext();
      }, DECAY_MS - elapsedInStep);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [comboBase, lastFindAt]);

  if (comboBase == null || lastFindAt == null) return null;

  const combo = Math.max(1, comboBase - elapsedSteps);
  if (combo <= 1) return null;

  return (
    <div className="combo-ring" aria-hidden="true">
      <div className="combo-ring-fill" key={`${lastFindAt}-${elapsedSteps}`}>
        <div className="combo-ring-inner">x{combo}</div>
      </div>
    </div>
  );
}
