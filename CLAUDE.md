# RECALL (memochamp)

Quiz "nomme tous les personnages" : React 19 + TypeScript + Vite, react-router, i18next (FR/EN).

## Déploiement / URLs

- Hébergé sur Vercel (`recall-cde.vercel.app`), mais l'URL canonique publique est
  **`https://cde-laro.dev/recall/{league|valorant|overwatch}`** — d'où le
  `basename="/recall"` dans `src/main.tsx` et le `base` absolu dans `vite.config.ts`
  (assets servis cross-domain, header CORS dans `vercel.json`).
- `vercel.json` pose aussi `Cache-Control: immutable` sur `/assets/*` (fichiers
  hashés par Vite), `nosniff`, `Referrer-Policy` et une **CSP** : `script-src`/
  `style-src` doivent inclure `recall-cde.vercel.app` (base absolu ⇒ assets
  cross-origin vus depuis cde-laro.dev) ; `img-src` liste les CDN de portraits
  (ddragon, media.valorant-api.com, d15f34w2p8l1cc.cloudfront.net pour
  Overwatch) ; tout nouvel hôte d'image/API doit y être ajouté.
- Toute URL affichée à l'utilisateur (partage, SEO) doit pointer sur `cde-laro.dev/recall/...`
  (cf. `src/utils/shareText.ts`).

## Structure

- `src/main.tsx` + `src/GameRoute.tsx` — `GameRoute` porte l'état `lang`
  (i18next + `<html lang>` + persistance) et monte `Game` avec
  `key={`${game}-${lang}`}`. Le reset d'une run se fait par **remontage**
  (changement de jeu ou de langue) — pas d'effets de reset dans `Game.tsx`.
  Ne pas réintroduire de `useEffect` qui setState en synchrone (règle lint
  `react-hooks/set-state-in-effect`).
- `src/Game.tsx` — composant principal (état du jeu, saisie) **et shell UI**.
  Reçoit `lang`/`onToggleLang` en props (plus d'état `lang` local). Layout
  `.shell` en 2 colonnes : `.rail` (gauche — marque, sélecteur de jeu, panneau
  `.stats`, « à propos », contrôles thème/langue/menu) et `.main` (abandon
  discret, `.command-bar` input+Valider, sous-titre, grille). Le sélecteur de
  jeu et les contrôles sont inline dans `Game.tsx` (il n'y a **plus de
  `TopBar`**). Sur mobile la rail se replie au-dessus de `.main` et `.stats`
  passe en carte horizontale. Style « app » lisse et arrondi calqué sur une
  maquette : typo **Inter** (plus d'Anton ni de JetBrains Mono ; cf.
  `index.html`), labels en casse normale, ombres douces, accent or/rouge/orange
  selon le jeu. Le **chrono est en grand en haut du `.main`** (`.timebar`), pas
  dans le panneau `.stats` (qui ne contient que progression + meilleur temps).
- `src/hooks/useGameData.ts` — fetch des personnages : Data Dragon (LoL),
  valorant-api.com, overfast-api.tekrop.fr (check `r.ok` sur chaque fetch via
  `fetchJson`). **Cache localStorage** via `src/utils/dataCache.ts` : clé
  `memochamp_cache_{game}_{lang}`, expiration au minuit local prochain. Le cache
  est lu dans l'initialiseur `useState` (pas dans l'effet) ; une réponse vide
  n'est jamais mise en cache. Exporte le type partagé `GameId`
  ('lol' | 'valorant' | 'overwatch') — ne pas redéclarer cette union ailleurs.
  **Fallback snapshot** : si l'API échoue, le hook sert le JSON committé de
  `src/data/{game}.{lang}.json` (importers statiques, map `SNAPSHOTS`) avec
  `stale: true` (petite note dans la rail), **sans** écrire le cache — l'API est
  retentée au prochain chargement.
- `src/data/` — 6 snapshots committés (base de secours) + `snapshots.test.ts`
  (validité). Rafraîchis par `scripts/update-snapshots.mjs`, branché en
  `prebuild` (donc à chaque déploiement Vercel) ; le script ne fait **jamais**
  échouer un build (fichier gardé tel quel si fetch KO/vide) et sa logique
  fetch+normalisation est volontairement dupliquée depuis `useGameData.ts`
  (Node pur vs TS navigateur) — garder les deux en phase.
- `src/components/` — Timer, ChampionGrid, ChampionCard, CompleteModal,
  ConfirmModal (plus de TopBar : la barre est inline dans `Game.tsx`). La modale
  de fin s'affiche sur run complète **ET sur abandon** (prop `completed=false`,
  score partiel `found/total`). **L'abandon ne remplit plus `found`** : la
  grille reçoit `revealMissed` et les non-trouvés passent en état `missed`
  (portrait désaturé, ✗ rouge) — 3 états de carte : locked/found/missed.
  `ConfirmModal` remplace `window.confirm` (état `pendingConfirm` dans Game,
  Escape/backdrop = annuler). Pendant `loading`, la grille affiche 24 cartes
  `.card.skeleton` (shimmer). Le tick 30ms du chrono vit dans `Timer.tsx` pour ne pas
  re-rendre la grille (Grid et Card sont mémoïsés) — ne pas remonter d'état
  haute fréquence dans Game.tsx. `Timer` rend juste la valeur (`.stat-big`),
  affichée dans le panneau `.stats` de la rail (chrono · progression
  `found/total` + barre · meilleur temps). `ChampionCard` : carte arrondie ;
  verrouillée = silhouette d'avatar (`.lock-glyph`, plus de « ? » ni de numéro),
  trouvée = portrait + bandeau nom.
- `src/utils/` — fonctions pures testées (normalize, formatTime, shareText,
  aliases, levenshtein, dataCache). `aliases.ts` : abréviations de saisie
  (mf, j4, asol…) ; les cibles LoL visent l'id Data Dragon (stable inter-langues),
  Valorant le nom, Overwatch la clé OverFast. `findCharacter` tolère en dernier
  recours 1-2 fautes de frappe (Levenshtein, seuil selon longueur, `null` si
  ambigu) — après l'exact et les alias. `shareText.ts` prend `found` + `total`
  (trophée seulement si complet ; barre emoji 🟩/⬛ de 10 cases, clampée 1–9
  sur run partielle).
- Best times en localStorage : `memochamp_best_{game}` ; langue/thème :
  `memochamp_lang`, `memochamp_theme` ; cache data : `memochamp_cache_{game}_{lang}`.

## Commandes

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (vitest).
- `node scripts/update-snapshots.mjs` — rafraîchit manuellement les snapshots
  de `src/data/` (sinon automatique via `prebuild`).
- Lint : **0 erreur** (les 3 `react-hooks/set-state-in-effect` ont été
  supprimées par le remontage via `key`, cf. Structure).
- Tests : suite mixte node + jsdom. Les utils sont en env node ; `Game.test.tsx`
  force jsdom via le docblock `// @vitest-environment jsdom` (mock de
  `useGameData`, rendu dans `MemoryRouter`). Pas de config globale jsdom.

## Conventions

- Texte UI toujours via i18next (`src/locales/{fr,en}.json`), jamais en dur.
- `docs/superpowers/` est gitignoré (specs de design locales uniquement).
