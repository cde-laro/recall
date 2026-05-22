# Memo.Champ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a LoL champion memory quiz app in React 19 + TypeScript with i18n (FR/EN), dark/light theme, and real Riot Data Dragon champion portraits.

**Architecture:** Vite 8 + React 19 SPA. All game state lives in `App.tsx`. `useChampionData` hook fetches the latest patch version + champion list from Riot's Data Dragon API in the active locale — re-fetching on language change resets game state. CSS custom properties drive dark/light theming via `data-theme` on `<html>`.

**Tech Stack:** React 19, Vite 8, TypeScript 6, react-i18next, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Google Fonts links, title |
| `src/main.tsx` | Bootstrap React + i18n |
| `src/i18n.ts` | react-i18next init, locale imports |
| `src/app.css` | CSS variables, themes, all component styles |
| `src/locales/fr.json` | French strings |
| `src/locales/en.json` | English strings |
| `src/utils/normalize.ts` | `normalize(s)` pure function |
| `src/utils/formatTime.ts` | `formatTime(ms)` pure function |
| `src/hooks/useChampionData.ts` | Fetch version + champions from Riot API |
| `src/components/TopBar.tsx` | Logo, patch chip, theme toggle, lang flag |
| `src/components/Scoreboard.tsx` | Found count, live timer, best time |
| `src/components/InputBar.tsx` | Text input + SUBMIT button |
| `src/components/ChampionGrid.tsx` | Grid layout, passes cards |
| `src/components/ChampionCard.tsx` | Single card, found/unfound state, Riot portrait |
| `src/components/CompleteModal.tsx` | End-of-run modal |
| `src/App.tsx` | Game state, submit logic, layout |

---

### Task 1: Install dependencies + Vitest

**Files:**
- Modify: `package.json` (via npm)
- Modify: `vite.config.ts`

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/cdelarocque/memochamp
npm install i18next react-i18next
```

Expected: exits 0, `i18next` and `react-i18next` appear in `package.json` dependencies.

- [ ] **Step 2: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 3: Update `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: install react-i18next and vitest"
```

---

### Task 2: Google Fonts + index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add font links and update title**

Replace the content of `index.html` with:

```html
<!doctype html>
<html lang="fr" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Memo.Champ</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add Google Fonts and update title"
```

---

### Task 3: CSS — variables, themes, global styles

**Files:**
- Modify: `src/app.css` (replace entirely)
- Delete: `src/App.css` (Vite default, unused)

- [ ] **Step 1: Remove default App.css**

```bash
rm /Users/cdelarocque/memochamp/src/App.css
```

- [ ] **Step 2: Replace `src/index.css` entirely with:**

```css
/* ===== Tokens ===== */
:root {
  --bg: #07090f;
  --bg-2: #0c1019;
  --surface: #11162370;
  --surface-solid: #111623;
  --line: #1c2436;
  --line-bright: #2c3a55;
  --ink: #e8ecf3;
  --ink-dim: #8893a8;
  --ink-mute: #4b5571;
  --gold: #d6a64a;
  --gold-bright: #f3c969;
  --danger: #ef4444;
  --success: #4ade80;
}

[data-theme="light"] {
  --bg: #f1ece1;
  --bg-2: #e8e1d0;
  --surface: #ffffff80;
  --surface-solid: #ffffff;
  --line: #d8d0bd;
  --line-bright: #b9ad91;
  --ink: #1a1814;
  --ink-dim: #5f5849;
  --ink-mute: #8a8270;
  --gold: #8a6b1e;
  --gold-bright: #b78919;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

body {
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--gold) 8%, transparent), transparent 60%),
    linear-gradient(180deg, var(--bg-2), var(--bg) 40%);
  background-attachment: fixed;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.18;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  z-index: 0;
}

/* ===== Layout ===== */
.app { position: relative; z-index: 1; max-width: 1480px; margin: 0 auto; padding: 28px 32px 80px; }

/* ===== TopBar ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 28px;
}

.brand { display: flex; align-items: center; gap: 14px; }

.brand-mark {
  width: 38px; height: 38px;
  display: grid; place-items: center;
  background: var(--gold);
  color: var(--bg);
  font-family: 'Anton', sans-serif;
  font-size: 22px;
  clip-path: polygon(12% 0, 100% 0, 100% 88%, 88% 100%, 0 100%, 0 12%);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.brand-text { font-family: 'Anton', sans-serif; font-size: 24px; letter-spacing: 0.18em; text-transform: uppercase; }
.brand-text .accent { color: var(--gold-bright); }
.brand-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.22em; color: var(--ink-mute); text-transform: uppercase; margin-top: 2px; }

.season-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.2em;
  color: var(--ink-dim);
  padding: 6px 10px;
  border: 1px solid var(--line-bright);
  text-transform: uppercase;
}

.topbar-right { display: flex; align-items: center; gap: 12px; }

.icon-btn {
  background: transparent;
  border: 1px solid var(--line-bright);
  color: var(--ink-dim);
  padding: 9px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 160ms ease;
}
.icon-btn:hover { color: var(--ink); border-color: var(--gold); background: color-mix(in oklab, var(--gold) 8%, transparent); }

.theme-btn {
  background: transparent;
  border: 1px solid var(--line-bright);
  color: var(--ink-dim);
  width: 36px; height: 36px;
  display: grid; place-items: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 160ms ease;
}
.theme-btn:hover { border-color: var(--gold); background: color-mix(in oklab, var(--gold) 8%, transparent); }

.lang-btn {
  background: transparent;
  border: 1px solid var(--line-bright);
  color: var(--ink-dim);
  width: 36px; height: 36px;
  display: grid; place-items: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 160ms ease;
  line-height: 1;
}
.lang-btn:hover { border-color: var(--gold); background: color-mix(in oklab, var(--gold) 8%, transparent); }

/* ===== Scoreboard ===== */
.scoreboard {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 32px;
  margin-bottom: 28px;
}

.score-side { display: flex; flex-direction: column; gap: 6px; }
.score-side.right { align-items: flex-end; text-align: right; }

.score-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.32em;
  color: var(--ink-mute); text-transform: uppercase;
}
.score-value { font-family: 'Anton', sans-serif; font-size: 44px; letter-spacing: 0.04em; line-height: 1; }
.score-value .small { font-size: 22px; color: var(--ink-dim); margin-left: 4px; }

.timer-shell {
  position: relative;
  padding: 14px 36px 18px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 1px solid var(--line-bright);
  background: linear-gradient(180deg, color-mix(in oklab, var(--gold) 6%, transparent), transparent);
  clip-path: polygon(4% 0, 96% 0, 100% 22%, 100% 100%, 0 100%, 0 22%);
  min-width: 280px;
}
.timer-shell::before, .timer-shell::after {
  content: ""; position: absolute; top: 0; width: 16px; height: 2px; background: var(--gold);
}
.timer-shell::before { left: 4%; transform: skewX(-50deg); }
.timer-shell::after  { right: 4%; transform: skewX(50deg); }

.timer-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.32em; color: var(--gold-bright); text-transform: uppercase; }
.timer-value { font-family: 'Anton', sans-serif; font-size: 72px; letter-spacing: 0.06em; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
.timer-value.live { color: var(--gold-bright); }
.timer-value .ms { font-size: 28px; color: var(--ink-dim); font-family: 'JetBrains Mono', monospace; letter-spacing: 0; margin-left: 8px; }

/* ===== InputBar ===== */
.input-bar {
  position: relative;
  display: flex; align-items: stretch;
  background: var(--surface);
  backdrop-filter: blur(6px);
  border: 1px solid var(--line-bright);
  margin-bottom: 24px;
  transition: border-color 200ms ease;
}
.input-bar.shake { animation: shake 320ms ease; }
.input-bar.flash-correct { border-color: var(--success); box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent); }
.input-bar.flash-wrong { border-color: var(--danger); }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.input-bar input {
  flex: 1;
  background: transparent; border: 0;
  color: var(--ink);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px; padding: 22px 24px;
  outline: none; font-weight: 500; letter-spacing: 0.01em;
}
.input-bar input::placeholder { color: var(--ink-mute); font-style: italic; }

.input-submit {
  background: var(--gold); color: var(--bg);
  border: 0;
  font-family: 'Anton', sans-serif; font-size: 18px; letter-spacing: 0.22em;
  padding: 0 36px; cursor: pointer; text-transform: uppercase;
  clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%);
  transition: background 160ms ease;
}
.input-submit:hover { background: var(--gold-bright); }
.input-submit:disabled { background: var(--ink-mute); cursor: not-allowed; }

/* ===== Status row ===== */
.status-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.22em;
  color: var(--ink-mute); text-transform: uppercase;
}
.status-row .controls { display: flex; gap: 10px; }
.status-row .last-found { color: var(--gold-bright); }
.status-row .last-found .name { color: var(--ink); margin-left: 8px; letter-spacing: 0.05em; }

/* ===== Progress bar ===== */
.progress-track {
  position: relative; height: 4px;
  background: var(--line); margin-bottom: 28px; overflow: hidden;
}
.progress-fill {
  position: absolute; inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--gold), var(--gold-bright));
  transition: width 400ms cubic-bezier(.2,.8,.2,1);
}
.progress-track::after {
  content: ""; position: absolute; inset: 0;
  background-image: linear-gradient(90deg, transparent calc(10% - 1px), var(--line-bright) 10%, transparent calc(10% + 1px));
  background-size: 10% 100%; opacity: 0.4;
}

/* ===== Grid ===== */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

/* ===== Card ===== */
.card {
  position: relative;
  aspect-ratio: 3 / 4;
  background: var(--surface-solid);
  border: 1px solid var(--line);
  overflow: hidden; cursor: default;
  display: flex; flex-direction: column; justify-content: flex-end;
  isolation: isolate;
  transition: transform 200ms ease, border-color 200ms ease;
}
.card.found {
  border-color: color-mix(in oklab, var(--gold) 60%, var(--line));
  animation: reveal 520ms cubic-bezier(.2,.8,.2,1);
}
.card.justfound {
  border-color: var(--gold-bright);
  box-shadow: 0 0 0 2px var(--gold), 0 10px 24px -8px color-mix(in oklab, var(--gold) 70%, transparent);
}
@keyframes reveal {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(1); }
}

/* corner cut */
.card::before {
  content: ""; position: absolute; top: 0; right: 0;
  width: 14px; height: 14px;
  background: var(--bg);
  clip-path: polygon(100% 0, 100% 100%, 0 0); z-index: 2;
}
.card::after {
  content: ""; position: absolute; top: 1px; right: 1px;
  width: 12px; height: 12px;
  background: var(--line-bright);
  clip-path: polygon(100% 0, 100% 100%, 0 0); z-index: 2;
}
.card.found::after { background: var(--gold); }

/* portrait area */
.card .portrait {
  position: absolute; inset: 0;
  display: grid; place-items: center; z-index: 1;
  overflow: hidden;
}
.card .portrait img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
}
.card .portrait .question {
  font-family: 'Anton', sans-serif;
  font-size: 60px; color: var(--line-bright);
  filter: blur(2px);
}

/* name banner */
.card .name-bar {
  position: relative; z-index: 2;
  padding: 8px 10px 9px;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.78));
  font-family: 'Anton', sans-serif;
  font-size: 14px; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ink);
  text-align: center; min-height: 32px; line-height: 1.1; text-wrap: balance;
}
.card:not(.found) .name-bar {
  color: var(--ink-mute);
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.5));
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.32em;
}

/* hint letter */
.card .hint-letter {
  position: absolute; top: 6px; left: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.2em;
  color: var(--ink-mute); z-index: 2;
}

/* number */
.card .num {
  position: absolute; bottom: 38px; left: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; color: var(--ink-mute); z-index: 2;
  letter-spacing: 0.1em; opacity: 0.75;
}

/* ===== Modal ===== */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(5,7,12,0.78);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  z-index: 80;
  animation: fadein 240ms ease;
}
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

.modal {
  width: min(520px, 92vw);
  background: var(--surface-solid);
  border: 1px solid var(--gold);
  padding: 36px 36px 28px;
  position: relative;
  clip-path: polygon(3% 0, 100% 0, 100% 94%, 97% 100%, 0 100%, 0 6%);
}
.modal h2 {
  font-family: 'Anton', sans-serif; font-size: 42px; letter-spacing: 0.14em;
  margin: 0 0 4px; color: var(--gold-bright); text-transform: uppercase;
}
.modal .sub {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.28em;
  color: var(--ink-dim); text-transform: uppercase; margin-bottom: 24px;
}
.modal .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 28px; }
.modal .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.28em; color: var(--ink-mute); text-transform: uppercase; }
.modal .stat-value { font-family: 'Anton', sans-serif; font-size: 36px; letter-spacing: 0.04em; }
.modal .stat-value.gold { color: var(--gold-bright); }
.modal .actions { display: flex; gap: 12px; }
.modal .actions button {
  flex: 1; background: var(--gold); color: var(--bg);
  border: 0; padding: 14px;
  font-family: 'Anton', sans-serif; letter-spacing: 0.2em; font-size: 14px;
  cursor: pointer; text-transform: uppercase;
}
.modal .actions button.secondary {
  background: transparent; color: var(--ink); border: 1px solid var(--line-bright);
}

/* ===== Responsive ===== */
@media (max-width: 720px) {
  .app { padding: 18px 16px 60px; }
  .scoreboard { grid-template-columns: 1fr; }
  .score-side.right { align-items: flex-start; text-align: left; }
  .timer-value { font-size: 56px; }
  .input-bar input { font-size: 17px; padding: 16px 14px; }
  .input-submit { padding: 0 18px; font-size: 14px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .season-chip { display: none; }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/cdelarocque/memochamp
git add src/index.css
git rm --cached src/App.css 2>/dev/null || true
git commit -m "feat: add full CSS design system with dark/light themes"
```

---

### Task 3: i18n setup

**Files:**
- Create: `src/i18n.ts`
- Create: `src/locales/fr.json`
- Create: `src/locales/en.json`

- [ ] **Step 1: Create `src/locales/fr.json`**

```json
{
  "topbar": {
    "season": "Saison 26",
    "patch": "Patch {{version}}",
    "newRun": "Nouvelle Run",
    "resetRecord": "Reset Record"
  },
  "scoreboard": {
    "found": "Champions Trouvés",
    "bestTime": "Meilleur Temps",
    "ready": "Prêt à démarrer",
    "live": "Run en cours",
    "finished": "Temps Final"
  },
  "input": {
    "placeholder": "Tape le nom d'un champion puis Entrée…",
    "placeholderDone": "Run terminée — appuyez sur Nouvelle Run",
    "submit": "Submit"
  },
  "status": {
    "hint": "// commence à taper. le chrono démarre au premier champion validé.",
    "lastFound": "Dernier",
    "giveUp": "Abandonner"
  },
  "modal": {
    "newRecord": "Nouveau Record",
    "complete": "Mission Accomplie",
    "subNewRecord": "// personal best logged",
    "subComplete": "// all champions identified",
    "finalTime": "Temps Final",
    "bestTime": "Meilleur Temps",
    "replay": "Rejouer",
    "viewGrid": "Voir la grille"
  },
  "confirm": {
    "giveUp": "Abandonner et révéler tous les champions ?",
    "resetRecord": "Effacer le meilleur temps enregistré ?"
  }
}
```

- [ ] **Step 2: Create `src/locales/en.json`**

```json
{
  "topbar": {
    "season": "Season 26",
    "patch": "Patch {{version}}",
    "newRun": "New Run",
    "resetRecord": "Reset Record"
  },
  "scoreboard": {
    "found": "Champions Found",
    "bestTime": "Best Time",
    "ready": "Ready to start",
    "live": "Run in progress",
    "finished": "Final Time"
  },
  "input": {
    "placeholder": "Type a champion name and press Enter…",
    "placeholderDone": "Run over — press New Run",
    "submit": "Submit"
  },
  "status": {
    "hint": "// start typing. timer starts on first correct answer.",
    "lastFound": "Last",
    "giveUp": "Give up"
  },
  "modal": {
    "newRecord": "New Record",
    "complete": "Mission Complete",
    "subNewRecord": "// personal best logged",
    "subComplete": "// all champions identified",
    "finalTime": "Final Time",
    "bestTime": "Best Time",
    "replay": "Play again",
    "viewGrid": "View grid"
  },
  "confirm": {
    "giveUp": "Give up and reveal all champions?",
    "resetRecord": "Clear the saved best time?"
  }
}
```

- [ ] **Step 3: Create `src/i18n.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('memochamp_lang') as 'fr' | 'en' | null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: savedLang ?? 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

export default i18n;
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts src/locales/
git commit -m "feat: add i18n setup with FR/EN translations"
```

---

### Task 4: `normalize` and `formatTime` utils + tests

**Files:**
- Create: `src/utils/normalize.ts`
- Create: `src/utils/formatTime.ts`
- Create: `src/utils/normalize.test.ts`
- Create: `src/utils/formatTime.test.ts`

- [ ] **Step 1: Write failing test for `normalize`**

Create `src/utils/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalize } from './normalize';

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('Aatrox')).toBe('aatrox');
  });
  it('strips apostrophes', () => {
    expect(normalize("Kai'Sa")).toBe('kaisa');
  });
  it('strips accents', () => {
    expect(normalize('Renéka')).toBe('reneka');
  });
  it('strips ampersand and spaces', () => {
    expect(normalize('Nunu & Willump')).toBe('nunuwillump');
  });
  it('strips dots', () => {
    expect(normalize('Dr. Mundo')).toBe('drmundo');
  });
  it('empty string', () => {
    expect(normalize('')).toBe('');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd /Users/cdelarocque/memochamp
npm test
```

Expected: `Cannot find module './normalize'`

- [ ] **Step 3: Implement `src/utils/normalize.ts`**

```ts
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test
```

Expected: `6 passed`

- [ ] **Step 5: Write failing test for `formatTime`**

Create `src/utils/formatTime.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toEqual({ mmss: '00:00', cs: '00' });
  });
  it('formats 1 minute 5 seconds', () => {
    expect(formatTime(65000)).toEqual({ mmss: '01:05', cs: '00' });
  });
  it('formats centiseconds', () => {
    expect(formatTime(1234)).toEqual({ mmss: '00:01', cs: '23' });
  });
  it('formats large value', () => {
    expect(formatTime(3661500)).toEqual({ mmss: '61:01', cs: '50' });
  });
});
```

- [ ] **Step 6: Run test — expect FAIL**

```bash
npm test
```

Expected: `Cannot find module './formatTime'`

- [ ] **Step 7: Implement `src/utils/formatTime.ts`**

```ts
export function formatTime(ms: number): { mmss: string; cs: string } {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return { mmss: `${m}:${s}`, cs };
}
```

- [ ] **Step 8: Run tests — expect all PASS**

```bash
npm test
```

Expected: `10 passed`

- [ ] **Step 9: Commit**

```bash
git add src/utils/
git commit -m "feat: add normalize and formatTime utils with tests"
```

---

### Task 5: `useChampionData` hook

**Files:**
- Create: `src/hooks/useChampionData.ts`

- [ ] **Step 1: Create `src/hooks/useChampionData.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useChampionData.ts
git commit -m "feat: add useChampionData hook with dynamic version fetch"
```

---

### Task 6: `TopBar` component

**Files:**
- Create: `src/components/TopBar.tsx`

- [ ] **Step 1: Create `src/components/TopBar.tsx`**

```tsx
import { useTranslation } from 'react-i18next';

interface Props {
  version: string;
  theme: 'dark' | 'light';
  lang: 'fr' | 'en';
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onNewRun: () => void;
  onResetRecord: () => void;
}

export function TopBar({ version, theme, lang, onToggleTheme, onToggleLang, onNewRun, onResetRecord }: Props) {
  const { t } = useTranslation();

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-text">Memo<span className="accent">.Champ</span></div>
          <div className="brand-sub">// Champion identification trial</div>
        </div>
      </div>

      {version && (
        <span className="season-chip">
          {t('topbar.season')} · {t('topbar.patch', { version })}
        </span>
      )}

      <div className="topbar-right">
        <button className="icon-btn" onClick={onResetRecord}>
          {t('topbar.resetRecord')}
        </button>
        <button className="icon-btn" onClick={onNewRun}>
          {t('topbar.newRun')}
        </button>
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

- [ ] **Step 2: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "feat: add TopBar component"
```

---

### Task 7: `Scoreboard` component

**Files:**
- Create: `src/components/Scoreboard.tsx`

- [ ] **Step 1: Create `src/components/Scoreboard.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';

interface Props {
  foundCount: number;
  total: number;
  startTime: number | null;
  endTime: number | null;
  now: number;
  bestTime: number | null;
}

export function Scoreboard({ foundCount, total, startTime, endTime, now, bestTime }: Props) {
  const { t } = useTranslation();

  const elapsed = endTime != null
    ? endTime - (startTime ?? endTime)
    : startTime != null
      ? now - startTime
      : 0;

  const isLive = startTime != null && endTime == null;
  const current = formatTime(elapsed);
  const best = bestTime != null ? formatTime(bestTime) : null;

  const timerLabel = endTime != null
    ? t('scoreboard.finished')
    : isLive
      ? t('scoreboard.live')
      : t('scoreboard.ready');

  return (
    <div className="scoreboard">
      <div className="score-side">
        <span className="score-label">{t('scoreboard.found')}</span>
        <span className="score-value">
          {String(foundCount).padStart(3, '0')}
          <span className="small">/ {total}</span>
        </span>
      </div>

      <div className="timer-shell">
        <span className="timer-label">{timerLabel}</span>
        <span className={`timer-value${isLive ? ' live' : ''}`}>
          {current.mmss}
          <span className="ms">.{current.cs}</span>
        </span>
      </div>

      <div className="score-side right">
        <span className="score-label">{t('scoreboard.bestTime')}</span>
        <span className="score-value" style={{ color: best ? 'var(--gold-bright)' : 'var(--ink-mute)' }}>
          {best ? best.mmss : '--:--'}
          <span className="small">{best ? `.${best.cs}` : ''}</span>
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Scoreboard.tsx
git commit -m "feat: add Scoreboard component"
```

---

### Task 8: `InputBar` component

**Files:**
- Create: `src/components/InputBar.tsx`

- [ ] **Step 1: Create `src/components/InputBar.tsx`**

```tsx
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: string;
  disabled: boolean;
  flash: 'correct' | 'wrong' | null;
  shake: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

export function InputBar({ value, disabled, flash, shake, onChange, onSubmit }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const cls = [
    'input-bar',
    shake ? 'shake' : '',
    flash === 'correct' ? 'flash-correct' : '',
    flash === 'wrong' ? 'flash-wrong' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        disabled={disabled}
        placeholder={disabled ? t('input.placeholderDone') : t('input.placeholder')}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
      />
      <button className="input-submit" disabled={disabled} onClick={onSubmit}>
        {t('input.submit')}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/InputBar.tsx
git commit -m "feat: add InputBar component"
```

---

### Task 9: `ChampionCard` component

**Files:**
- Create: `src/components/ChampionCard.tsx`

- [ ] **Step 1: Create `src/components/ChampionCard.tsx`**

```tsx
import type { Champion } from '../hooks/useChampionData';

interface Props {
  champion: Champion;
  version: string;
  index: number;
  found: boolean;
  justFound: boolean;
}

export function ChampionCard({ champion, version, index, found, justFound }: Props) {
  const cls = ['card', found ? 'found' : '', justFound ? 'justfound' : '']
    .filter(Boolean).join(' ');

  const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;

  return (
    <div className={cls}>
      <span className="num">#{String(index + 1).padStart(3, '0')}</span>
      <div className="portrait">
        {found
          ? <img src={imgUrl} alt={champion.name} loading="lazy" />
          : <span className="question">?</span>
        }
      </div>
      <div className="name-bar">
        {found ? champion.name : '—— LOCKED ——'}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChampionCard.tsx
git commit -m "feat: add ChampionCard with Riot portrait image"
```

---

### Task 10: `ChampionGrid` component

**Files:**
- Create: `src/components/ChampionGrid.tsx`

- [ ] **Step 1: Create `src/components/ChampionGrid.tsx`**

```tsx
import type { Champion } from '../hooks/useChampionData';
import { ChampionCard } from './ChampionCard';

interface Props {
  champions: Champion[];
  version: string;
  found: Set<string>;
  justFoundName: string | null;
}

export function ChampionGrid({ champions, version, found, justFoundName }: Props) {
  return (
    <div className="grid">
      {champions.map((champ, i) => (
        <ChampionCard
          key={champ.id}
          champion={champ}
          version={version}
          index={i}
          found={found.has(champ.name)}
          justFound={justFoundName === champ.name}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChampionGrid.tsx
git commit -m "feat: add ChampionGrid component"
```

---

### Task 11: `CompleteModal` component

**Files:**
- Create: `src/components/CompleteModal.tsx`

- [ ] **Step 1: Create `src/components/CompleteModal.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/formatTime';

interface Props {
  time: number;
  bestTime: number | null;
  isNewRecord: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export function CompleteModal({ time, bestTime, isNewRecord, onRestart, onClose }: Props) {
  const { t } = useTranslation();
  const current = formatTime(time);
  const best = bestTime != null ? formatTime(bestTime) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isNewRecord ? t('modal.newRecord') : t('modal.complete')}</h2>
        <div className="sub">
          {isNewRecord ? t('modal.subNewRecord') : t('modal.subComplete')}
        </div>
        <div className="stats">
          <div>
            <div className="stat-label">{t('modal.finalTime')}</div>
            <div className="stat-value gold">
              {current.mmss}
              <span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>.{current.cs}</span>
            </div>
          </div>
          <div>
            <div className="stat-label">{t('modal.bestTime')}</div>
            <div className="stat-value">
              {best ? best.mmss : '--:--'}
              <span style={{ fontSize: 18, color: 'var(--ink-dim)', marginLeft: 6 }}>
                {best ? `.${best.cs}` : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="actions">
          <button onClick={onRestart}>{t('modal.replay')}</button>
          <button className="secondary" onClick={onClose}>{t('modal.viewGrid')}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CompleteModal.tsx
git commit -m "feat: add CompleteModal component"
```

---

### Task 12: `App.tsx` — wire everything together

**Files:**
- Modify: `src/App.tsx` (replace entirely)

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useChampionData } from './hooks/useChampionData';
import { normalize } from './utils/normalize';
import { TopBar } from './components/TopBar';
import { Scoreboard } from './components/Scoreboard';
import { InputBar } from './components/InputBar';
import { ChampionGrid } from './components/ChampionGrid';
import { CompleteModal } from './components/CompleteModal';

export default function App() {
  const { t } = useTranslation();

  const [lang, setLang] = useState<'fr' | 'en'>(
    () => (localStorage.getItem('memochamp_lang') as 'fr' | 'en') ?? 'fr'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('memochamp_theme') as 'dark' | 'light') ?? 'dark'
  );
  const [found, setFound] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const raw = localStorage.getItem('memochamp_best');
    return raw ? Number(raw) : null;
  });
  const [showModal, setShowModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [justFoundName, setJustFoundName] = useState<string | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  const [lastFound, setLastFound] = useState<string | null>(null);

  const { version, champions, loading } = useChampionData(lang);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('memochamp_theme', theme);
  }, [theme]);

  // Language change: sync i18next + reset game
  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('memochamp_lang', lang);
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setShowModal(false);
    setJustFoundName(null);
    setLastFound(null);
  }, [lang]);

  // Timer tick
  useEffect(() => {
    if (startTime == null || endTime != null) return;
    const id = setInterval(() => setNow(Date.now()), 30);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const resetGame = useCallback(() => {
    setFound(new Set());
    setQuery('');
    setStartTime(null);
    setEndTime(null);
    setNow(Date.now());
    setShowModal(false);
    setIsNewRecord(false);
    setJustFoundName(null);
    setLastFound(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (endTime != null || !champions.length) return;
    const norm = normalize(query);
    if (!norm) return;

    const match = champions.find(c => normalize(c.name) === norm);
    if (match && !found.has(match.name)) {
      const next = new Set(found);
      next.add(match.name);
      const startedAt = startTime ?? Date.now();
      if (!startTime) setStartTime(startedAt);
      setFound(next);
      setLastFound(match.name);
      setJustFoundName(match.name);
      setTimeout(() => setJustFoundName(prev => prev === match.name ? null : prev), 900);
      setQuery('');
      setFlash('correct');
      setTimeout(() => setFlash(null), 320);

      if (next.size === champions.length) {
        const finishedAt = Date.now();
        setEndTime(finishedAt);
        const elapsed = finishedAt - startedAt;
        const newRecord = bestTime == null || elapsed < bestTime;
        if (newRecord) {
          setBestTime(elapsed);
          localStorage.setItem('memochamp_best', String(elapsed));
        }
        setIsNewRecord(newRecord);
        setTimeout(() => setShowModal(true), 500);
      }
    } else {
      setFlash('wrong');
      setShake(true);
      setTimeout(() => { setFlash(null); setShake(false); }, 360);
    }
  }, [query, found, startTime, endTime, champions, bestTime]);

  const handleGiveUp = useCallback(() => {
    if (!confirm(t('confirm.giveUp'))) return;
    setFound(new Set(champions.map(c => c.name)));
    setEndTime(Date.now());
  }, [champions, t]);

  const handleResetRecord = useCallback(() => {
    if (!confirm(t('confirm.resetRecord'))) return;
    localStorage.removeItem('memochamp_best');
    setBestTime(null);
  }, [t]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const toggleLang = useCallback(() => {
    setLang(l => l === 'fr' ? 'en' : 'fr');
  }, []);

  return (
    <div className="app">
      <TopBar
        version={version}
        theme={theme}
        lang={lang}
        onToggleTheme={toggleTheme}
        onToggleLang={toggleLang}
        onNewRun={resetGame}
        onResetRecord={handleResetRecord}
      />

      <Scoreboard
        foundCount={found.size}
        total={champions.length}
        startTime={startTime}
        endTime={endTime}
        now={now}
        bestTime={bestTime}
      />

      <InputBar
        value={query}
        disabled={endTime != null || loading}
        flash={flash}
        shake={shake}
        onChange={setQuery}
        onSubmit={handleSubmit}
      />

      <div className="status-row">
        <div>
          {lastFound ? (
            <span className="last-found">
              {t('status.lastFound')} <span className="name">{lastFound}</span>
            </span>
          ) : (
            <span>{t('status.hint')}</span>
          )}
        </div>
        <div className="controls">
          <button className="icon-btn" onClick={handleGiveUp} disabled={endTime != null}>
            {t('status.giveUp')}
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${champions.length ? (found.size / champions.length) * 100 : 0}%` }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
          // Loading champions…
        </div>
      ) : (
        <ChampionGrid
          champions={champions}
          version={version}
          found={found}
          justFoundName={justFoundName}
        />
      )}

      {showModal && endTime != null && startTime != null && (
        <CompleteModal
          time={endTime - startTime}
          bestTime={bestTime}
          isNewRecord={isNewRecord}
          onRestart={resetGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up App.tsx with full game state"
```

---

### Task 13: `main.tsx` — bootstrap

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "feat: bootstrap app with i18n init"
```

---

### Task 14: Visual verification

- [ ] **Step 1: Run the dev server**

```bash
cd /Users/cdelarocque/memochamp
npm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Verify dark theme**
  - Background is near-black with gold grid texture
  - "Memo.Champ" logo visible with gold accent
  - Season chip shows "Saison 26 · Patch X.X.X" (live version)
  - Timer shows "00:00.00", label says "Prêt à démarrer"
  - Grid of locked cards visible (all "—— LOCKED ——")

- [ ] **Step 3: Verify game flow**
  - Type "aatrox" + Enter → card reveals with Riot portrait, timer starts, progress bar moves
  - Type gibberish → input bar shakes red
  - Type same champion again → shakes (already found)

- [ ] **Step 4: Verify light theme**
  - Click ☀️ → page switches to light/bone colors

- [ ] **Step 5: Verify language switch**
  - Click 🇬🇧 → UI switches to English, grid resets, champion names change to English

- [ ] **Step 6: Run type check**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Memo.Champ v1 — LoL champion memory quiz with i18n and Riot portraits"
```
