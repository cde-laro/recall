# Logos de marque — provenance

Utilisés par `src/components/GameBadge.tsx` pour les badges `.brand-mark`
(fond clair/dégradé → variante `black`) et `.game-select-mark` (fond
sombre/translucide → variante `white`).

- **`lol-black.svg` / `lol-white.svg`** — fichiers officiels du kit presse
  Riot Games (`brand.riotgames.com` → League of Legends → Logos, package
  `LoL_Icon_Flat_Black_White.zip`).
- **`overwatch.svg`** — logo officiel Overwatch (fourni directement par
  l'utilisateur ; le press kit Blizzard officiel est derrière une
  authentification à laquelle nous n'avons pas accès).
- **`valorant-black.svg` / `valorant-white.svg`** — reconstitution vectorielle
  communautaire du logo Valorant (source : svgrepo.com, cf. commentaire dans
  le fichier), **pas** le fichier officiel Riot (leur kit presse
  `playvalorant.com` ne fournit ce logo qu'en PNG, aucune version vectorielle
  n'y est proposée). `valorant-white.svg` est dérivé de `valorant-black.svg`
  par simple changement de `fill` (même forme, même technique que les
  variantes noir/blanc officielles de LoL).

Si Riot publie un jour un SVG officiel pour Valorant, remplacer
`valorant-black.svg`/`valorant-white.svg` par les fichiers officiels.
