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
  Overwatch) ; tout nouvel hôte d'image/API doit y être ajouté. La police
  **Geist est self-hostée** (`@fontsource-variable/geist`, importée dans
  `src/main.tsx`, woff2 émis dans `/assets`) — **plus de Google Fonts** :
  `font-src` = `'self' https://recall-cde.vercel.app` (assets cross-origin),
  et `style-src` ne liste plus `fonts.googleapis.com`. Ne pas réintroduire de
  `<link>` vers fonts.googleapis/gstatic.
- Toute URL affichée à l'utilisateur (partage, SEO) doit pointer sur `cde-laro.dev/recall/...`
  (cf. `src/utils/shareText.ts`).

## Structure

- `src/main.tsx` + `src/GameRoute.tsx` — `GameRoute` porte l'état `lang`
  (i18next + `<html lang>` + persistance) et monte `Game` avec
  `key={`${game}-${lang}`}`. Le reset d'une run se fait par **remontage**
  (changement de jeu ou de langue) — pas d'effets de reset dans `Game.tsx`.
  Ne pas réintroduire de `useEffect` qui setState en synchrone (règle lint
  `react-hooks/set-state-in-effect`). La route `/` sert `HomeRoute` (page
  d'accueil, plus une redirection) ; la route `*` de repli redirige vers `/`
  (pas `/league`) — sans elle, une URL inconnue sous `/recall/` affichait une
  page blanche (le rewrite Vercel sert `index.html` pour tout).
- `src/HomeRoute.tsx` — page d'accueil (sélection de jeu), même schéma que
  `GameRoute` pour l'état `lang`. Fond `PortraitMarquee`
  (`src/components/PortraitMarquee.tsx`, purement décoratif, `aria-hidden`) :
  lignes de portraits qui défilent en boucle CSS pure, mélangées aléatoirement
  et dupliquées pour boucler sans à-coup (mélange calculé une fois, pas à
  chaque render), sens alterné une ligne sur deux, vitesses légèrement
  différentes par ligne. **Chargement dynamique** (`import()` dans un effet,
  pas un import statique) des snapshots `src/data/*.fr.json` : un import
  statique forcerait Vite à fusionner ces JSON dans le bundle principal et
  casserait le découpage en chunks paresseux déjà utilisé par le fallback de
  `useGameData.ts` sur les mêmes fichiers. `pointer-events: none` pour ne
  jamais intercepter les clics des cartes de jeu au premier plan ; sous
  `prefers-reduced-motion`, le défilement se **met en pause**
  (`animation-play-state: paused !important` — le `!important` est
  nécessaire car le raccourci `animation` de `.marquee-row`, déclaré plus bas
  dans le fichier, réinitialiserait sinon `animation-play-state` à `running`
  via l'ordre de cascade). Chaque carte de jeu affiche le vrai logo
  (`GameBadge`) et, si une run complète existe déjà, **temps ET score**
  ensemble (les deux sont toujours posés au même moment, cf. `Game.tsx`) —
  sinon « Pas encore joué ». `GAME_LABELS`/`GAME_PATHS`/`BRAND_MARK` vivent
  dans `src/gameMeta.ts` (partagés entre `Game.tsx` et `HomeRoute.tsx` — ne
  pas les redéclarer localement dans l'un ou l'autre).
- `src/Game.tsx` — composant principal (état du jeu, saisie) **et shell UI**.
  Reçoit `lang`/`onToggleLang` en props (plus d'état `lang` local). Layout
  `.shell` en 2 colonnes : `.rail` (gauche — marque, sélecteur de jeu, panneau
  `.stats`, contrôles langue/menu ; plus de thème light, de panneau
  « à propos » ni de tagline) et `.main` (abandon discret, `.command-bar` input+Valider,
  sous-titre « Dernier trouvé », grille). La **`.command-bar` est `sticky`
  (top:0, fond frosté, fallback opaque sous `prefers-reduced-transparency`)** :
  l'input reste toujours atteignable quand la grille défile dessous — ne pas
  la sortir du flux ni retirer le sticky. Pendant `loading`, `Game` early-return
  un **loader plein écran** `.page-loading` (brand-mark pulsante) — pas de shell. Le sélecteur de
  jeu et les contrôles sont inline dans `Game.tsx` (il n'y a **plus de
  `TopBar`**). Les icônes (menu, chevron, drapeau d'abandon) viennent de
  **Phosphor** (`@phosphor-icons/react`, `weight="bold"`) — plus de glyphes
  Unicode ; garder une seule famille d'icônes. Sur mobile la rail se replie au-dessus de `.main` et `.stats`
  passe en carte horizontale. Style « app » lisse et arrondi calqué sur une
  maquette : typo **Geist** (self-hostée via `@fontsource-variable/geist`,
  famille `'Geist Variable'` ; plus d'Inter/Anton/JetBrains Mono), labels en casse normale, ombres douces, accent or/rouge/orange
  selon le jeu. Le **chrono est en grand en haut du `.main`** (`.timebar`), pas
  dans le panneau `.stats` (qui ne contient que progression + meilleur temps).
  `GameBadge` (`src/components/GameBadge.tsx`) affiche le vrai logo du jeu
  (`public/logos/`, provenance documentée dans `public/logos/README.md`) à la
  place de la lettre `BRAND_MARK` quand un logo existe pour ce jeu — variante
  `black` sur `.brand-mark` (fond clair/dégradé), `white` sur
  `.game-select-mark` (fond sombre), ou `universal` pour un logo déjà
  bicolore utilisable tel quel dans les deux contextes. Repli silencieux sur
  la lettre si aucun logo n'est défini pour le jeu.
- `src/hooks/useGameData.ts` — fetch des personnages : Data Dragon (LoL),
  valorant-api.com, overfast-api.tekrop.fr (check `r.ok` + `AbortSignal.timeout(10_000)`
  sur chaque fetch via `fetchJson` — une API qui pend doit rejeter pour
  déclencher le fallback snapshot, pas bloquer le loader indéfiniment).
  **Cache localStorage** via `src/utils/dataCache.ts` : clé
  `memochamp_cache_{game}_{lang}`, expiration au minuit local prochain. Le cache
  est lu dans l'initialiseur `useState` (pas dans l'effet) ; une réponse vide
  n'est jamais mise en cache. Exporte le type partagé `GameId`
  ('lol' | 'valorant' | 'overwatch') — ne pas redéclarer cette union ailleurs.
  **Fallback snapshot** : si l'API échoue, le hook sert le JSON committé de
  `src/data/{game}.{lang}.json` (importers statiques, map `SNAPSHOTS`) avec
  `stale: true` (petite note dans la rail), **sans** écrire le cache — l'API est
  retentée au prochain chargement.
- `src/hooks/usePreloadImages.ts` — précharge les portraits (concurrence 6)
  dès que le roster est connu, appelé par `Game` : la révélation d'une carte
  sort du cache HTTP, pas de flash.
- `src/data/` — 6 snapshots committés (base de secours) + `snapshots.test.ts`
  (validité). Rafraîchis par `scripts/update-snapshots.mjs`, branché en
  `prebuild` (donc à chaque déploiement Vercel) ; le script ne fait **jamais**
  échouer un build (fichier gardé tel quel si fetch KO/vide) et sa logique
  fetch+normalisation est volontairement dupliquée depuis `useGameData.ts`
  (Node pur vs TS navigateur) — garder les deux en phase.
- `src/components/` — Timer, ComboRing, ChampionGrid, ChampionCard,
  CompleteModal, ConfirmModal (plus de TopBar : la barre est inline dans
  `Game.tsx`). La modale de fin s'affiche sur run complète **ET sur abandon**
  (prop `completed=false`, score partiel `found/total`). **L'abandon ne
  remplit plus `found`** : la grille reçoit `revealMissed` et les non-trouvés
  passent en état `missed` (portrait désaturé, ✗ rouge) — 3 états de base de
  carte (locked/found/missed) + 2 pulses transitoires sur `found` (~900ms,
  mutuellement exclusifs sur une même carte) : `justfound` (éclat or diagonal,
  vraie nouvelle trouvaille) et `duplicate` (lueur rouge pulsée, nom déjà
  trouvé retapé — si un `justfound` est encore actif sur ce même nom au
  moment du retype, `handleSubmit` le coupe court avant de poser `duplicate`,
  pour garantir l'exclusion mutuelle). `ConfirmModal` remplace
  `window.confirm` (état `pendingConfirm` dans Game, Escape/backdrop =
  annuler). Le focus trap (Tab piégé, focus initial, restitution au unmount)
  est factorisé dans `src/hooks/useDialogFocus.ts`, partagé par `ConfirmModal`
  et `CompleteModal` — le callback de fermeture passé (`onCancel`/`onClose`)
  doit rester stable (`useCallback`), l'effet en dépend. Les popovers du rail
  (menu ⋯, sélecteur de jeu) ferment sur Escape (retour du focus au bouton
  déclencheur) en plus du clic extérieur, et portent `role="menu"` /
  `role="menuitem"` en cohérence avec `aria-haspopup="menu"`. Le tick 30ms du
  chrono vit dans `Timer.tsx` pour ne pas re-rendre la grille (Grid et Card
  sont mémoïsés) — ne pas remonter d'état haute fréquence dans Game.tsx.
  `Timer` rend juste la valeur (`.stat-big`). `ChampionCard` : carte
  arrondie ; verrouillée = silhouette d'avatar (`.lock-glyph`, plus de « ? »
  ni de numéro), trouvée = portrait + bandeau nom.
- **Score et combo** — panneau `.stats` de la rail : progression `found/total`
  + barre, **Score** (cumulatif, `.stat-score-row` avec la valeur + `ComboRing`),
  meilleur temps. Mécanique (état dans `Game.tsx` : `score`, `comboBase`,
  `lastFindAt`) : chaque trouvaille rapporte des points = valeur du combo au
  moment de la trouvaille (calcul dérivé des timestamps, pas d'état tické),
  puis incrémente le combo de 1 ; chaque tranche de 5s d'inactivité depuis la
  dernière trouvaille fait -1, **plancher à 1** (jamais 0) ; une mauvaise
  saisie n'affecte ni le score ni le combo (seul le temps écoulé compte).
  `ComboRing` (`src/components/ComboRing.tsx`) affiche l'anneau **seulement
  si le combo affiché est > 1** (aucun bonus actif ⇒ pas de rendu, y compris
  à l'état idle avant la première trouvaille) ; le remplissage est une
  **animation CSS pure** (`@property --combo-pct` + `@keyframes
  combo-ring-deplete`, `animation-fill-mode: forwards`), remontée via
  `key={`${lastFindAt}-${elapsedSteps}`}` pour repartir de 100% à **chaque**
  trouvaille et à **chaque palier de 5s** (pas seulement la première fois,
  sinon l'anneau reste vide indéfiniment) ; seul le chiffre affiché déclenche
  un re-render, via une chaîne de `setTimeout` auto-reprogrammée (jamais un
  `setInterval` qui poll). Best score indépendant du meilleur temps
  (`memochamp_bestscore_{game}`, même durcissement `Number.isFinite` +
  `try/catch` que `bestTime`, mis à jour uniquement sur run complète, jamais
  sur abandon) — les deux records coexistent, un run peut battre l'un sans
  l'autre. `topbar.resetRecord` / `confirm.resetRecord` réinitialisent
  désormais **les deux** records. `CompleteModal` affiche Score/Meilleur
  Score en plus de Temps Final/Meilleur Temps ; le sous-titre « Nouveau
  Record » distingue temps/score/les deux (`modal.subNewRecordTime` /
  `subNewRecordScore` / `subNewRecordBoth`, plus d'unique clé
  `subNewRecord`). `shareText.ts` inclut une ligne `⭐ {score} pts`.
- `src/utils/` — fonctions pures testées (normalize, formatTime, shareText,
  aliases, levenshtein, dataCache). `aliases.ts` : abréviations de saisie
  (mf, j4, asol…) ; les cibles LoL visent l'id Data Dragon (stable inter-langues),
  Valorant le nom, Overwatch la clé OverFast. `findCharacter` tolère en dernier
  recours 1-2 fautes de frappe (Levenshtein, seuil selon longueur, `null` si
  ambigu) — après l'exact et les alias. `shareText.ts` prend `found` + `total`
  (trophée seulement si complet ; barre emoji 🟩/⬛ de 10 cases, clampée 1–9
  sur run partielle).
- Best times en localStorage : `memochamp_best_{game}` ; meilleur score :
  `memochamp_bestscore_{game}` ; langue/thème : `memochamp_lang` (plus de
  thème light — dark uniquement) ; cache data : `memochamp_cache_{game}_{lang}`.

## Commandes

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (vitest).
- `node scripts/update-snapshots.mjs` — rafraîchit manuellement les snapshots
  de `src/data/` (sinon automatique via `prebuild`).
- CI : `.github/workflows/ci.yml` (push/PR sur `main`) — `npm ci`, lint, test,
  build ; `npm run build` déclenche `prebuild` donc appelle les 3 APIs en
  direct depuis le runner (le script ne fait jamais échouer le job, cf.
  `update-snapshots.mjs`).
- Lint : **0 erreur** (les 3 `react-hooks/set-state-in-effect` ont été
  supprimées par le remontage via `key`, cf. Structure).
- Tests : suite mixte node + jsdom. Les utils sont en env node ; `Game.test.tsx`
  force jsdom via le docblock `// @vitest-environment jsdom` (mock de
  `useGameData`, rendu dans `MemoryRouter`). Pas de config globale jsdom.

## Conventions

- Texte UI toujours via i18next (`src/locales/{fr,en}.json`), jamais en dur.
- **Zéro em-dash (`—`), en-dash (`–`) ou middle-dot (`·`) dans le texte
  visible** (titres, aria-labels, `shareText.ts`, locales) : séparateurs ASCII
  uniquement (`-`, `:`, `,`). Copie en **langage naturel** — plus de préfixe
  `//` facon commentaire sur les sous-titres de modale ou les messages d'erreur.
- `docs/superpowers/` est gitignoré (specs de design locales uniquement).
