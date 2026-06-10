# RECALL (memochamp)

Quiz "nomme tous les personnages" : React 19 + TypeScript + Vite, react-router, i18next (FR/EN).

## Déploiement / URLs

- Hébergé sur Vercel (`recall-cde.vercel.app`), mais l'URL canonique publique est
  **`https://cde-laro.dev/recall/{league|valorant|overwatch}`** — d'où le
  `basename="/recall"` dans `src/main.tsx` et le `base` absolu dans `vite.config.ts`
  (assets servis cross-domain, header CORS dans `vercel.json`).
- Toute URL affichée à l'utilisateur (partage, SEO) doit pointer sur `cde-laro.dev/recall/...`
  (cf. `src/utils/shareText.ts`).

## Structure

- `src/Game.tsx` — composant principal (état du jeu, timer, saisie).
- `src/hooks/useGameData.ts` — fetch des personnages : Data Dragon (LoL),
  valorant-api.com, overfast-api.tekrop.fr. Pas de cache local.
- `src/components/` — TopBar, ChampionGrid, ChampionCard, CompleteModal
  (la modale de fin ne s'affiche que sur run complète, pas sur abandon).
- `src/utils/` — fonctions pures testées (normalize, formatTime, shareText).
- Best times en localStorage : `memochamp_best_{game}` ; langue/thème :
  `memochamp_lang`, `memochamp_theme`.

## Commandes

- `npm run dev` / `npm run build` / `npm run lint` / `npm test` (vitest).
- Lint : 4 erreurs `react-hooks/purity` préexistantes dans Game.tsx et
  useGameData.ts (connues, pas introduites par les features récentes).

## Conventions

- Texte UI toujours via i18next (`src/locales/{fr,en}.json`), jamais en dur.
- `docs/superpowers/` est gitignoré (specs de design locales uniquement).
