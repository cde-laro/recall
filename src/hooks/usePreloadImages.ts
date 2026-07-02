import { useEffect } from 'react';

// Précharge des images avec une concurrence bornée : une fois le roster
// connu, les portraits sont déjà dans le cache HTTP quand une carte se
// révèle — pas de flash de chargement au premier « trouvé ».
const CONCURRENCY = 6;

export function usePreloadImages(urls: string[]) {
  useEffect(() => {
    if (!urls.length) return;
    let cancelled = false;
    const queue = [...urls];

    function loadNext() {
      if (cancelled) return;
      const url = queue.shift();
      if (!url) return;
      const img = new Image();
      img.onload = loadNext;
      img.onerror = loadNext;
      img.src = url;
    }

    for (let i = 0; i < CONCURRENCY; i++) loadNext();
    return () => { cancelled = true; };
  }, [urls]);
}
