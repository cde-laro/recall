import { normalize } from './normalize';
import { levenshtein } from './levenshtein';
import type { Character, GameId } from '../hooks/useGameData';

// Alias normalisé → cible normalisée. La cible est comparée au nom ET à l'id
// du personnage : pour LoL on vise l'id Data Dragon (stable quelle que soit la
// langue, ex. "Nunu et Willump" en FR a l'id "Nunu"), pour Valorant le nom
// (les ids sont des uuids), pour Overwatch la clé OverFast.
const ALIASES: Record<GameId, Record<string, string>> = {
  lol: {
    asol: 'aurelionsol',
    aurelion: 'aurelionsol',
    blitz: 'blitzcrank',
    cait: 'caitlyn',
    cass: 'cassiopeia',
    ez: 'ezreal',
    gp: 'gangplank',
    heca: 'hecarim',
    j4: 'jarvaniv',
    jarvan: 'jarvaniv',
    kass: 'kassadin',
    kata: 'katarina',
    kha: 'khazix',
    kog: 'kogmaw',
    lb: 'leblanc',
    lee: 'leesin',
    liss: 'lissandra',
    malph: 'malphite',
    malz: 'malzahar',
    mf: 'missfortune',
    morde: 'mordekaiser',
    morg: 'morgana',
    mundo: 'drmundo',
    naut: 'nautilus',
    nid: 'nidalee',
    noc: 'nocturne',
    nunu: 'nunu',
    nunuwillump: 'nunu',
    nunuetwillump: 'nunu',
    ori: 'orianna',
    panth: 'pantheon',
    renata: 'renataglasc',
    renek: 'renekton',
    sej: 'sejuani',
    sera: 'seraphine',
    shyv: 'shyvana',
    tahm: 'tahmkench',
    tf: 'twistedfate',
    tk: 'tahmkench',
    trist: 'tristana',
    trynd: 'tryndamere',
    vlad: 'vladimir',
    voli: 'volibear',
    ww: 'warwick',
    xin: 'xinzhao',
    yi: 'masteryi',
    zil: 'zilean',
  },
  valorant: {
    brim: 'brimstone',
    kj: 'killjoy',
  },
  overwatch: {
    ball: 'wreckingball',
    bap: 'baptiste',
    brig: 'brigitte',
    hog: 'roadhog',
    jq: 'junkerqueen',
    rein: 'reinhardt',
    soldier: 'soldier76',
    sym: 'symmetra',
    torb: 'torbjorn',
    widow: 'widowmaker',
    zen: 'zenyatta',
  },
};

function maxFuzzyDistance(len: number): number {
  if (len < 4) return 0;   // trop court : un edit change trop le sens
  if (len < 8) return 1;
  return 2;
}

export function findCharacter(characters: Character[], query: string, game: GameId): Character | null {
  const norm = normalize(query);
  if (!norm) return null;

  const direct = characters.find(c => normalize(c.name) === norm);
  if (direct) return direct;

  const target = ALIASES[game][norm] ?? norm;
  const aliased = characters.find(c => normalize(c.id) === target || normalize(c.name) === target);
  if (aliased) return aliased;

  // Dernier recours : tolérance aux fautes de frappe sur le nom affiché.
  const maxDist = maxFuzzyDistance(norm.length);
  if (maxDist === 0) return null;

  let best: Character | null = null;
  let bestDist = maxDist + 1;
  let tie = false;
  for (const c of characters) {
    const d = levenshtein(norm, normalize(c.name));
    if (d > maxDist) continue;
    if (d < bestDist) { bestDist = d; best = c; tie = false; }
    else if (d === bestDist) { tie = true; }
  }
  return tie ? null : best;
}
