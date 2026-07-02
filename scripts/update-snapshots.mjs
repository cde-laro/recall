// Rafraîchit les snapshots de données committés dans src/data/.
// Lancé en prebuild (donc à chaque déploiement Vercel).
// Ne doit JAMAIS faire échouer un build : toute erreur laisse le fichier
// committé en place (c'est la base de secours) et sort en code 0.
// NB : la logique fetch+normalisation est volontairement dupliquée depuis
// src/hooks/useGameData.ts (le hook est du TS navigateur, ce script du Node
// pur) — garder les deux en phase si un jeu ou un champ change.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

const LOL_LOCALE = { fr: 'fr_FR', en: 'en_US' };
const VAL_LOCALE = { fr: 'fr-FR', en: 'en-US' };
const OW_LOCALE = { fr: 'fr-fr', en: 'en-us' };

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  return r.json();
}

async function fetchLol(lang) {
  const versions = await json('https://ddragon.leagueoflegends.com/api/versions.json');
  const version = versions[0];
  const data = await json(`https://ddragon.leagueoflegends.com/cdn/${version}/data/${LOL_LOCALE[lang]}/champion.json`);
  const characters = Object.values(data.data)
    .map(c => ({
      name: c.name,
      id: c.id,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  return { version, characters };
}

async function fetchValorant(lang) {
  const data = await json(`https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${VAL_LOCALE[lang]}`);
  const characters = data.data
    .map(a => ({ name: a.displayName, id: a.uuid, imageUrl: a.displayIcon }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  return { version: '', characters };
}

async function fetchOverwatch(lang) {
  const data = await json(`https://overfast-api.tekrop.fr/heroes?locale=${OW_LOCALE[lang]}`);
  const characters = data
    .map(h => ({ name: h.name, id: h.key, imageUrl: h.portrait }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  return { version: '', characters };
}

const FETCHERS = { lol: fetchLol, valorant: fetchValorant, overwatch: fetchOverwatch };

await mkdir(OUT_DIR, { recursive: true });
for (const game of Object.keys(FETCHERS)) {
  for (const lang of ['fr', 'en']) {
    const file = path.join(OUT_DIR, `${game}.${lang}.json`);
    try {
      const snapshot = await FETCHERS[game](lang);
      if (!snapshot.characters.length) throw new Error('liste vide');
      await writeFile(file, JSON.stringify(snapshot, null, 2) + '\n');
      console.log(`✓ ${game}.${lang}.json (${snapshot.characters.length} personnages)`);
    } catch (e) {
      console.warn(`⚠ ${game}.${lang}.json non rafraîchi : ${e instanceof Error ? e.message : e}`);
    }
  }
}
