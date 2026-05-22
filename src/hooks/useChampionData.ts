import { useState, useEffect } from 'react';

export interface Champion {
  name: string;
  id: string;
}

interface State {
  version: string;
  champions: Champion[];
  loading: boolean;
  error: string | null;
}

const LOCALE_MAP: Record<'fr' | 'en', string> = {
  fr: 'fr_FR',
  en: 'en_US',
};

export function useChampionData(lang: 'fr' | 'en'): State {
  const [state, setState] = useState<State>({
    version: '',
    champions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    async function fetchData() {
      try {
        const versions: string[] = await fetch(
          'https://ddragon.leagueoflegends.com/api/versions.json'
        ).then(r => r.json());

        const version = versions[0];
        const locale = LOCALE_MAP[lang];

        const data = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/champion.json`
        ).then(r => r.json());

        const champions: Champion[] = Object.values(data.data as Record<string, { name: string; id: string }>)
          .map(c => ({ name: c.name, id: c.id }))
          .sort((a, b) => a.name.localeCompare(b.name, lang));

        if (!cancelled) {
          setState({ version, champions, loading: false, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: String(e) }));
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [lang]);

  return state;
}
