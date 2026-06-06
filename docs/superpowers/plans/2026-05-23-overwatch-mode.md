# Overwatch Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Overwatch as a third game mode alongside League of Legends and Valorant, with orange theme, hero portraits from the overfast API, and a dropdown for switching between all three games.

**Architecture:** Extend the `game` type union to `'lol' | 'valorant' | 'overwatch'`, add a `fetchOverwatch()` branch in `useGameData`, register a `/overwatch` route, apply `[data-game="overwatch"]` CSS tokens, and replace the two-state toggle button in `TopBar` with a click-outside dropdown.

**Tech Stack:** React, React Router v6, i18next, CSS custom properties, overfast community API (`overfast-api.genesyk.com`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useGameData.ts` | Modify | Add `'overwatch'` to game type + `fetchOverwatch()` |
| `src/main.tsx` | Modify | Add `/overwatch` route |
| `src/index.css` | Modify | Add `[data-game="overwatch"]` tokens + dropdown styles |
| `src/components/TopBar.tsx` | Modify | Replace toggle button with 3-game dropdown |

---

### Task 1: Add Overwatch data fetching

**Files:**
- Modify: `src/hooks/useGameData.ts`

The overfast API endpoint is `https://overfast-api.genesyk.com/heroes?locale=<locale>`.
Response shape: `Array<{ key: string; name: string; portrait: string; role: string }>`.
Locale format: `fr-FR` / `en-US`.

- [ ] **Step 1: Extend the game type and add locale map**

Open `src/hooks/useGameData.ts`. The current signature is `useGameData(game: 'lol' | 'valorant', lang: 'fr' | 'en')`. Replace the full file content with:

```typescript
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
const OW_LOCALE: Record<'fr' | 'en', string> = { fr: 'fr-FR', en: 'en-US' };

export function useGameData(game: 'lol' | 'valorant' | 'overwatch', lang: 'fr' | 'en'): State {
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

    async function fetchOverwatch() {
      const data = await fetch(
        `https://overfast-api.genesyk.com/heroes?locale=${OW_LOCALE[lang]}`
      ).then(r => r.json());
      const characters: Character[] = (data as Array<{ key: string; name: string; portrait: string }>)
        .map(h => ({ name: h.name, id: h.key, imageUrl: h.portrait }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      if (!cancelled) setState({ version: '', characters, loading: false, error: null });
    }

    const fetch$ = game === 'lol' ? fetchLol() : game === 'valorant' ? fetchValorant() : fetchOverwatch();
    fetch$.catch(e => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
    });

    return () => { cancelled = true; };
  }, [game, lang]);

  return state;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/cdelarocque/memochamp && npx tsc --noEmit
```

Expected: no errors related to `useGameData`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameData.ts
git commit -m "feat: add Overwatch data fetching via overfast API"
```

---

### Task 2: Add /overwatch route

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Add the route**

Open `src/main.tsx`. The current routes are `/league` and `/valorant`. Add `/overwatch`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import './index.css';
import { Game } from './Game';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/league" replace />} />
        <Route path="/league" element={<Game game="lol" />} />
        <Route path="/valorant" element={<Game game="valorant" />} />
        <Route path="/overwatch" element={<Game game="overwatch" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/cdelarocque/memochamp && npx tsc --noEmit
```

Expected: no errors. The `Game` component already accepts `game: 'lol' | 'valorant'` — Task 1 changed `useGameData` but `Game.tsx` still has the old prop type. If tsc reports a type error on `game="overwatch"` in `Game.tsx`, fix it:

Open `src/Game.tsx` line 12 and change:
```tsx
// before
interface Props {
  game: 'lol' | 'valorant';
}
// after
interface Props {
  game: 'lol' | 'valorant' | 'overwatch';
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx src/Game.tsx
git commit -m "feat: add /overwatch route"
```

---

### Task 3: CSS tokens for Overwatch theme

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add Overwatch dark theme tokens**

Open `src/index.css`. After the existing `[data-game="valorant"][data-theme="light"]` block (around line 37), add:

```css
[data-game="overwatch"] {
  --gold: #F99E1A;
  --gold-bright: #FFBC3B;
  --bg: #0d0f14;
  --bg-2: #14161c;
  --surface-solid: #191b22;
  --line: #21242e;
  --line-bright: #2e3240;
}

[data-game="overwatch"][data-theme="light"] {
  --bg: #f0ece3;
  --bg-2: #e8e3d8;
  --surface-solid: #faf7f0;
  --line: #d6cfc0;
  --line-bright: #c0b8a4;
  --gold: #c97c00;
  --gold-bright: #a86200;
}
```

- [ ] **Step 2: Verify no visual regression**

Start the dev server:
```bash
cd /Users/cdelarocque/memochamp && npm run dev
```

Navigate to `/league`, `/valorant`, `/overwatch` and confirm:
- LoL: gold/blue tones unchanged
- Valorant: red tones unchanged
- Overwatch: orange tones applied

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add Overwatch CSS theme tokens (orange)"
```

---

### Task 4: Replace toggle button with game dropdown in TopBar

**Files:**
- Modify: `src/components/TopBar.tsx`
- Modify: `src/index.css` (dropdown styles)

The current TopBar has a `game-btn` that navigates between two games. Replace it with a dropdown showing all three. The dropdown closes on outside click via a `useEffect` + `ref`.

- [ ] **Step 1: Rewrite TopBar.tsx**

Replace the full content of `src/components/TopBar.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type Game = 'lol' | 'valorant' | 'overwatch';

interface Props {
  version: string;
  theme: 'dark' | 'light';
  lang: 'fr' | 'en';
  game: Game;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onNewRun: () => void;
  onResetRecord: () => void;
}

const GAME_LABELS: Record<Game, string> = {
  lol: 'League',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

const GAME_PATHS: Record<Game, string> = {
  lol: '/league',
  valorant: '/valorant',
  overwatch: '/overwatch',
};

const BRAND_MARK: Record<Game, string> = {
  lol: 'M',
  valorant: 'V',
  overwatch: 'O',
};

const BRAND_SUB: Record<Game, string> = {
  lol: '// Champion identification trial',
  valorant: '// Agent identification trial',
  overwatch: '// Hero identification trial',
};

const SEASON_CHIP: Record<Game, string> = {
  lol: '',
  valorant: 'Valorant',
  overwatch: 'Overwatch',
};

export function TopBar({ version, theme, lang, game, onToggleTheme, onToggleLang, onNewRun, onResetRecord }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const chipLabel = game === 'lol'
    ? (version ? `${t('topbar.season')} · ${t('topbar.patch', { version })}` : '')
    : SEASON_CHIP[game];

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">{BRAND_MARK[game]}</div>
        <div>
          <div className="brand-text">cde-laro<span className="accent">.dev</span></div>
          <div className="brand-sub">{BRAND_SUB[game]}</div>
        </div>
      </div>

      <span className="season-chip">{chipLabel}</span>

      <div className="topbar-right">
        <button className="icon-btn" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn" onClick={onNewRun}>
          {t('topbar.newRun')}
        </button>

        <div className="game-dropdown" ref={dropdownRef}>
          <button
            className="game-btn active"
            onClick={() => setOpen(o => !o)}
            title="Switch game"
          >
            {BRAND_MARK[game]}
          </button>
          {open && (
            <div className="game-menu">
              {(Object.keys(GAME_LABELS) as Game[]).map(g => (
                <button
                  key={g}
                  className={`game-menu-item${g === game ? ' current' : ''}`}
                  onClick={() => { setOpen(false); navigate(GAME_PATHS[g]); }}
                >
                  <span className="game-menu-mark">{BRAND_MARK[g]}</span>
                  {GAME_LABELS[g]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="theme-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="lang-btn" onClick={onToggleLang} title="Switch language">
          {lang === 'fr' ? '🇬🇧' : '🇫🇷'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add dropdown CSS**

In `src/index.css`, after the `.game-btn.active { ... }` line (around line 182), add:

```css
.game-dropdown {
  position: relative;
}

.game-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface-solid);
  border: 1px solid var(--line-bright);
  min-width: 140px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.game-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--ink-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease, color 120ms ease;
}
.game-menu-item:hover { background: color-mix(in oklab, var(--gold) 8%, transparent); color: var(--ink); }
.game-menu-item.current { color: var(--gold-bright); }

.game-menu-mark {
  font-family: 'Anton', sans-serif;
  font-size: 14px;
  width: 16px;
  text-align: center;
  color: var(--gold-bright);
  opacity: 0.7;
}
.game-menu-item.current .game-menu-mark { opacity: 1; }
```

- [ ] **Step 3: Remove unused `onToggleGame` prop from TopBar call sites**

Check `src/Game.tsx` — the `TopBar` component is called there. The old prop was `onToggleGame`. Open `src/Game.tsx` and remove the `onToggleGame` prop from the `TopBar` call and from `toggleGame` callback if it exists.

Current TopBar call in `Game.tsx`:
```tsx
<TopBar
  version={version}
  theme={theme}
  lang={lang}
  game={game}
  onToggleTheme={toggleTheme}
  onToggleLang={toggleLang}
  onNewRun={resetGame}
  onResetRecord={handleResetRecord}
/>
```

The current `Game.tsx` already doesn't pass `onToggleGame` (it was removed in the routing refactor). Verify this is the case — if `onToggleGame` appears anywhere in `Game.tsx`, remove it.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/cdelarocque/memochamp && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test in browser**

```bash
npm run dev
```

- Navigate to `/league` → brand mark shows "M", subtitle shows "// Champion identification trial"
- Open dropdown → shows League / Valorant / Overwatch, League is highlighted
- Click Valorant → navigates to `/valorant`, brand mark "V", red theme
- Click Overwatch → navigates to `/overwatch`, brand mark "O", orange theme, heroes grid loads
- Click outside dropdown → closes without navigating
- Light mode toggle works for all 3 games

- [ ] **Step 6: Commit**

```bash
git add src/components/TopBar.tsx src/index.css src/Game.tsx
git commit -m "feat: game switcher dropdown with Overwatch support"
```
