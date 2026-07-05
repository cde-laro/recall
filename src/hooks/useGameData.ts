import { useState, useEffect } from 'react';
import { readCache, writeCache, nextMidnight } from '../utils/dataCache';

export type GameId = 'lol' | 'valorant' | 'overwatch';

export interface Character {
  name: string;
  id: string;
  imageUrl: string;
}

interface State {
  version: string;
  characters: Character[];
  loading: boolean;
  error: string | null;
  /** true si les données viennent du snapshot local (API injoignable). */
  stale: boolean;
}

interface Snapshot {
  version: string;
  characters: Character[];
}

const LOL_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr_FR', en: 'en_US' };
const VAL_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr-FR', en: 'en-US' };
const OW_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr-fr', en: 'en-us' };

// Importers statiques (analysables par Vite) vers les snapshots committés,
// rafraîchis à chaque build par scripts/update-snapshots.mjs.
const SNAPSHOTS: Record<GameId, Record<'fr' | 'en', () => Promise<{ default: Snapshot }>>> = {
  lol: { fr: () => import('../data/lol.fr.json'), en: () => import('../data/lol.en.json') },
  valorant: { fr: () => import('../data/valorant.fr.json'), en: () => import('../data/valorant.en.json') },
  overwatch: { fr: () => import('../data/overwatch.fr.json'), en: () => import('../data/overwatch.en.json') },
};

async function fetchJson<T>(url: string): Promise<T> {
  // Timeout : une API qui pend (au lieu d'échouer) ne doit pas bloquer le
  // loader indéfiniment — sans rejet, le fallback snapshot ne se déclenche jamais.
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  return r.json() as Promise<T>;
}

export function useGameData(game: GameId, lang: 'fr' | 'en'): State {
  // game/lang sont stables pour la durée de vie du hook (Game est remonté par
  // key={game-lang}), donc lire le cache à l'init évite un setState en effet.
  const [state, setState] = useState<State>(() => {
    const cached = readCache<{ version: string; characters: Character[] }>(
      localStorage,
      `memochamp_cache_${game}_${lang}`,
      Date.now()
    );
    return cached
      ? { version: cached.version, characters: cached.characters, loading: false, error: null, stale: false }
      : { version: '', characters: [], loading: true, error: null, stale: false };
  });

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `memochamp_cache_${game}_${lang}`;

    // Cache déjà servi par l'initialiseur ci-dessus : rien à fetch.
    if (readCache(localStorage, cacheKey, Date.now())) {
      return;
    }

    function store(version: string, characters: Character[]) {
      if (cancelled) return;
      // On ne met en cache qu'un résultat non vide : une réponse 200 vide ne
      // doit pas geler une liste vide jusqu'au lendemain (un reload doit retenter).
      if (characters.length) {
        writeCache(localStorage, cacheKey, { version, characters }, nextMidnight(Date.now()));
      }
      setState({ version, characters, loading: false, error: null, stale: false });
    }

    async function fetchLol() {
      const versions = await fetchJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json');
      const version = versions[0];
      const data = await fetchJson<{ data: Record<string, { name: string; id: string }> }>(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/${LOL_LOCALE[lang]}/champion.json`
      );
      const characters: Character[] = Object.values(data.data)
        .map(c => ({
          name: c.name,
          id: c.id,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store(version, characters);
    }

    async function fetchValorant() {
      const data = await fetchJson<{ data: Array<{ displayName: string; uuid: string; displayIcon: string }> }>(
        `https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${VAL_LOCALE[lang]}`
      );
      const characters: Character[] = data.data
        .map(a => ({ name: a.displayName, id: a.uuid, imageUrl: a.displayIcon }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store('', characters);
    }

    async function fetchOverwatch() {
      const data = await fetchJson<Array<{ key: string; name: string; portrait: string }>>(
        `https://overfast-api.tekrop.fr/heroes?locale=${OW_LOCALE[lang]}`
      );
      const characters: Character[] = data
        .map(h => ({ name: h.name, id: h.key, imageUrl: h.portrait }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store('', characters);
    }

    const fetch$ = game === 'lol' ? fetchLol() : game === 'valorant' ? fetchValorant() : fetchOverwatch();
    fetch$.catch(async e => {
      // API injoignable : on sert le snapshot committé (rafraîchi à chaque
      // déploiement), sans le mettre en cache pour retenter l'API ensuite.
      try {
        const { default: snap } = await SNAPSHOTS[game][lang]();
        if (cancelled) return;
        if (!snap.characters.length) throw e;
        setState({ version: snap.version, characters: snap.characters, loading: false, error: null, stale: true });
      } catch {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
      }
    });

    return () => { cancelled = true; };
  }, [game, lang]);

  return state;
}
