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
}

const LOL_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr_FR', en: 'en_US' };
const VAL_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr-FR', en: 'en-US' };
const OW_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr-fr', en: 'en-us' };

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
      ? { version: cached.version, characters: cached.characters, loading: false, error: null }
      : { version: '', characters: [], loading: true, error: null };
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
      setState({ version, characters, loading: false, error: null });
    }

    async function fetchLol() {
      const versions: string[] = await fetch(
        'https://ddragon.leagueoflegends.com/api/versions.json'
      ).then(r => r.json());
      const version = versions[0];
      const data = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/${LOL_LOCALE[lang]}/champion.json`
      ).then(r => r.json());
      const characters: Character[] = Object.values(
        data.data as Record<string, { name: string; id: string }>
      )
        .map(c => ({
          name: c.name,
          id: c.id,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store(version, characters);
    }

    async function fetchValorant() {
      const data = await fetch(
        `https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${VAL_LOCALE[lang]}`
      ).then(r => r.json());
      const characters: Character[] = (data.data as Array<{ displayName: string; uuid: string; displayIcon: string }>)
        .map(a => ({ name: a.displayName, id: a.uuid, imageUrl: a.displayIcon }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store('', characters);
    }

    async function fetchOverwatch() {
      const data = await fetch(
        `https://overfast-api.tekrop.fr/heroes?locale=${OW_LOCALE[lang]}`
      ).then(r => r.json());
      const characters: Character[] = (data as Array<{ key: string; name: string; portrait: string }>)
        .map(h => ({ name: h.name, id: h.key, imageUrl: h.portrait }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      store('', characters);
    }

    const fetch$ = game === 'lol' ? fetchLol() : game === 'valorant' ? fetchValorant() : fetchOverwatch();
    fetch$.catch(e => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
    });

    return () => { cancelled = true; };
  }, [game, lang]);

  return state;
}
