# Memo.Champ — Design Spec

**Date:** 2026-05-22  
**Stack:** Vite 8 · React 19 · TypeScript · react-i18next  
**Deployment:** `cde-laro.dev/lab/memochamp` via Vercel rewrite from portfolio repo

---

## Overview

A League of Legends champion memory quiz. The user types champion names into an input; each correct answer reveals the champion's portrait in a grid. A timer starts on the first correct answer and stops when all champions are found. Best time is persisted in localStorage.

Visual design: dark esports aesthetic (angular clip-paths, gold accents, Anton + Space Grotesk + JetBrains Mono fonts). Adapted from a Claude Design prototype.

---

## File Structure

```
src/
├── main.tsx                  # Bootstrap React + i18n
├── i18n.ts                   # react-i18next setup (fr/en)
├── app.css                   # CSS variables, dark/light themes, global styles
├── App.tsx                   # Game state owner
├── locales/
│   ├── en.json
│   └── fr.json
├── data/
│   └── champions.ts          # normalize() helper
├── hooks/
│   └── useChampionData.ts    # Fetch Riot Data Dragon → version + name→id map
└── components/
    ├── TopBar.tsx
    ├── InputBar.tsx
    ├── Scoreboard.tsx
    ├── ChampionGrid.tsx
    ├── ChampionCard.tsx
    └── CompleteModal.tsx
```

---

## Data & Champion Fetching

`useChampionData(lang: 'fr' | 'en')`:

1. Fetch `https://ddragon.leagueoflegends.com/api/versions.json` → take first element as `version`
2. Map lang to locale: `fr → fr_FR`, `en → en_US`
3. Fetch `https://ddragon.leagueoflegends.com/cdn/{version}/data/{locale}/champion.json`
4. Return `{ version, champions: Array<{ name: string, id: string }> }`

Champion portrait URL: `https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{id}.png`

**Language switch:** re-fetches champion data in the new locale. Resets game state (found set cleared, timer stopped) since names change.

---

## Game State (App.tsx)

```ts
found: Set<string>         // champion names identified this run
query: string              // current input value
startTime: number | null   // Date.now() on first correct answer
endTime: number | null     // Date.now() when all found
bestTime: number | null    // persisted in localStorage('memochamp_best')
theme: 'dark' | 'light'   // persisted in localStorage('memochamp_theme')
lang: 'fr' | 'en'         // drives i18next + useChampionData re-fetch
```

---

## Submit Logic

1. Normalize input: lowercase → NFD decompose → strip diacritics → strip non-alphanumeric
2. Find a champion where `normalize(champion.name) === normalize(input)`
3. **Match & not yet found:**
   - Add to `found`
   - If `startTime === null`, set `startTime = Date.now()`
   - Clear input
   - If `found.size === total`: set `endTime`, compare with `bestTime`, open modal
4. **No match or already found:** shake + red flash animation on input bar

`normalize` handles: "kaisa" → "Kai'Sa", "nunu" → "Nunu & Willump", French accented names, etc.

---

## Components

### TopBar
- Left: brand mark "M" (gold clip-path hexagon) + "Memo.Champ" (Anton)
- Center: "Season 26 · Patch {version}" chip (JetBrains Mono)
- Right: 🌙/☀️ theme toggle + 🇫🇷/🇬🇧 flag language switcher

### Scoreboard
Three-column grid:
- Left: "Champions Found" count (`found.size / total`)
- Center: large timer display (starts at 00:00.00, goes live on first answer, gold when running)
- Right: "Best Time" (gold if set, muted dashes if not)

### InputBar
- Prefix label `> CHAMP` (JetBrains Mono, gold)
- Text input (no autocomplete)
- Angular gold SUBMIT button (clip-path skew)
- Shake + red border on wrong answer, green glow on correct

### ChampionCard (ratio 3/4)
- Corner cut via `::before/::after` pseudo-elements
- **Not found:** blurred "?" silhouette, locked name bar
- **Found:** real Riot portrait image as background, champion name revealed, `reveal` scale animation
- **Just found:** gold border glow for ~900ms

### CompleteModal
- Clip-path angular border
- Title: "Nouveau Record" / "New Record" or "Mission Accomplie" / "Mission Complete"
- Stats: final time + best time
- Buttons: Replay + View grid

---

## Theming

CSS custom properties on `:root` (dark) with `[data-theme="light"]` override on `<html>`.

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#07090f` | `#f1ece1` |
| `--ink` | `#e8ecf3` | `#1a1814` |
| `--gold` | `#d6a64a` | `#8a6b1e` |
| `--gold-bright` | `#f3c969` | `#b78919` |

Applied via `document.documentElement.setAttribute('data-theme', theme)` on mount and on toggle.

---

## i18n

`react-i18next` with `fr` as default language (user is French).

Key namespaces in `locales/{lang}.json`:
- `topbar`: season chip, buttons (Reset Record, New Run)
- `scoreboard`: labels (Champions Found, Best Time, Final Time, Ready, Live, etc.)
- `input`: placeholder, submit button
- `status`: last found message, give up button, start hint
- `modal`: title variants, stat labels, action buttons

---

## Progress Bar

Full-width 4px bar below the status row. Fills left-to-right with a gold gradient as `found.size / total` grows. Segmented tick marks every 10%.

---

## Deployment

- Standalone Vite app at `/Users/cdelarocque/memochamp`
- Own GitHub repo, own Vercel project (root: `/`)
- Portfolio `vercel.json` adds: `{ "source": "/lab/memochamp/:path*", "destination": "https://memochamp.vercel.app/:path*" }`
- Portfolio "Experiments" section lists it with link
