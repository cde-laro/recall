# Compact Scroll — Design Spec

**Date:** 2026-05-22  
**Fichier concerné:** `src/App.tsx`, `src/index.css`

---

## Objectif

La zone sticky (scoreboard + input) doit se comprimer progressivement quand l'utilisateur scrolle, passant d'un layout plein à une barre unique compacte.

---

## Layout

### État complet (scrollY = 0)

Layout actuel inchangé :
- Scoreboard 3 colonnes : Found count · Timer centré · Best time
- Input bar pleine largeur en dessous
- Status row + progress bar

### État compact (scrollY ≥ seuil ~150px)

Une seule ligne flex de ~48px :

```
[ Trouvés 001/172 ] [ 00:34.57 ] [ input flex:1 ] [ SUBMIT ] [ Meilleur 02:14 ]
```

- **Found box** (gauche) : label "Trouvés" + nombre/total
- **Timer box** : fond légèrement doré, timer gold en 26px
- **Input** : flex:1, prend tout l'espace restant
- **Submit** : bouton doré, texte verticalement centré (`display:flex; align-items:center`)
- **Best box** (droite) : label "Meilleur" + temps gold — séparé du Submit par une bordure gauche
- **Progress bar** : reste en dessous de la ligne compacte

La status row ("Dernier : X" + bouton Abandonner) disparaît en état compact.

---

## Transition

Deux états distincts (pas d'interpolation progressive par CSS calc) :
- Seuil : `scrollY >= 150px` → classe `is-compact` ajoutée sur `.sticky-zone`
- Transition CSS : `opacity` + `transform: translateY` pour croiser les deux états
- Durée : 200ms ease

### DOM structure

Deux blocs dans `.sticky-zone` :

```tsx
<div className="sticky-zone">
  {/* Bloc complet — visible quand !isCompact */}
  <div className="hud-full">
    <Scoreboard … />
    <InputBar … />
    <div className="status-row">…</div>
    <div className="progress-track">…</div>
  </div>

  {/* Bloc compact — visible quand isCompact */}
  <div className="hud-compact">
    <div className="compact-line">
      <div className="compact-found">…</div>
      <div className="compact-timer">…</div>
      <input … />
      <button className="input-submit">…</button>
      <div className="compact-best">…</div>
    </div>
    <div className="progress-track">…</div>
  </div>
</div>
```

### CSS transitions

```css
.hud-full  { transition: opacity 200ms ease, transform 200ms ease; }
.hud-compact { transition: opacity 200ms ease, transform 200ms ease; }

/* État normal */
.hud-compact { opacity: 0; pointer-events: none; transform: translateY(-6px); height: 0; overflow: hidden; }

/* État compact */
.sticky-zone.is-compact .hud-full    { opacity: 0; pointer-events: none; }
.sticky-zone.is-compact .hud-compact { opacity: 1; pointer-events: auto; transform: translateY(0); height: auto; }
```

---

## Implémentation JS

Hook scroll dans `App.tsx` :

```tsx
const stickyRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const onScroll = () => {
    stickyRef.current?.classList.toggle('is-compact', window.scrollY >= 150);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

---

## Tokens CSS à ajouter

Classes nouvelles dans `index.css` :
- `.hud-full` / `.hud-compact` — wrappers avec transitions
- `.compact-line` — flex row 48px de hauteur
- `.compact-found` / `.compact-timer` / `.compact-best` — blocs gauche/timer/droite
- `.input-submit` — ajouter `display: flex; align-items: center; justify-content: center`

---

## I18n

Le bloc compact utilise les mêmes clés de traduction :
- `t('scoreboard.found')` → label du found box
- `t('scoreboard.bestTime')` → label du best box
- `t('input.placeholder')` / `t('input.placeholderDone')` → placeholder de l'input compact
- `t('input.submit')` → texte du bouton

---

## Ce qui ne change pas

- La TopBar reste non-sticky (scroll normalement hors champ)
- Le `bestTime` reste en localStorage, la logique de jeu est inchangée
- Aucun changement aux composants `Scoreboard`, `InputBar`, `CompleteModal`
