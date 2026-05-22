import { useState, useEffect } from 'react';

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

export function useGameData(game: 'lol' | 'valorant', lang: 'fr' | 'en'): State {
  const [state, setState] = useState<State>({
    version: '',
    characters: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

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
      if (!cancelled) setState({ version, characters, loading: false, error: null });
    }

    async function fetchValorant() {
      const data = await fetch(
        `https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${VAL_LOCALE[lang]}`
      ).then(r => r.json());
      const characters: Character[] = (data.data as Array<{ displayName: string; uuid: string; displayIcon: string }>)
        .map(a => ({ name: a.displayName, id: a.uuid, imageUrl: a.displayIcon }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      if (!cancelled) setState({ version: '', characters, loading: false, error: null });
    }

    (game === 'lol' ? fetchLol() : fetchValorant()).catch(e => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
    });

    return () => { cancelled = true; };
  }, [game, lang]);

  return state;
}
