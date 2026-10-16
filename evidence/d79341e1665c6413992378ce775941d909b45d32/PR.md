# feat(demo-ball-thrust): scène physique Rapier jouable (#70)

Closes #70

## Base / branche

- Base : `776dca6819d68d15b679c2338b327d6b78168222`.
- Branche : `feat/70-ball-thrust-3d`.
- Commit source testé : `d79341e1665c6413992378ce775941d909b45d32`.
- Le commit de preuves qui suit ne modifie pas les sources exécutées.

## Réalisé

- Nouveau package Vite/React/Three `packages/demo-ball-thrust/`, sans modification des packages RL ni du catalogue.
- Sphère dynamique Rapier, impulsions réelles, gravité/friction/restitution/CCD, sol, quatre murs et trois obstacles fixes.
- Clavier 8 directions + no-op, caméra orbitale, HUD issu de Rapier, cible atteignable et reset uint32 reproductible.
- Erreur textuelle sans WebGL ; focus clavier, libération des touches au blur et mise en page étroite.
- Factory physique commune aux tests WASM et au monde R3F ; R3F ne pilote jamais la pose physique.
- Réutilisation des versions résolues ; seul l’importer du nouveau package s’ajoute au lockfile.

## Vérifications

- [x] `pnpm test` : builds réussis, 457 tests passent, 3 ignorés faute de `HF_TOKEN`.
- [x] `pnpm run typecheck` et typecheck/build du package.
- [x] 41 tests dédiés : reset/trajectoire déterministe, impulsions/no-op, sol, collisions et bornes sur 4 graines × 8 directions × 30 s.
- [x] Chrome réel avec fenêtre : cible atteinte au clavier, collision/rebond, mur, huit directions, trois resets identiques et graine différente, orbite, blur et champ de saisie.
- [x] WebGL refusé : erreur textuelle, aucune exception/page ou erreur console.
- [x] Rendu desktop et viewport étroit simulé ; captures.
- [x] Mesure 30 s sur Apple M4 / ANGLE Metal : 120,01 FPS RAF moyens, p95 9,2 ms, 0 erreur console.

Preuves complètes : `evidence/d79341e1665c6413992378ce775941d909b45d32/README.md`.

## Limites volontaires

Pas d’agent ni d’interface RL dans le lot 1/3 ; pas de contrôleur tactile ni de mesure sur matériel mobile. Avertissement d’initialisation de la dépendance Rapier 0.15.0 et avertissements de taille de bundle conservés et documentés. Pas de push, merge, publication ni déploiement exécuté : PR préparée localement pour publication par le propriétaire.
