# feat(demo-ball-thrust): jeu physique Rapier et articles EN/FR (#70)

Closes #70

## Branche et base

- Branche : `feat/70-ball-thrust-3d`.
- Base demandée : `776dca6819d68d15b679c2338b327d6b78168222`.
- SHA source final testé : `67b37dfe945b2af9554c9c7e83d227f35b0d4ceb`.
- Commits principaux : `d79341e` pour le jeu physique, `3eca165` pour ses premières preuves, `162f18b` pour les articles et l’intégration web, `67b37df` pour la compatibilité du test avec la cible TypeScript web. Le commit de preuves final ne change pas les sources testées.

## Réalisé

- `packages/demo-ball-thrust/` : sphère dynamique Rapier, sol, murs et trois obstacles fixes ; impulsions, friction, restitution, CCD et collisions réelles.
- Clavier 8 directions et no-op, caméra orbitale, HUD issu de Rapier, cible et reset uint32 reproductible. Pas de déplacement cinématique ni de seconde simulation contrôlée par le rendu.
- 41 tests physiques utilisant le vrai moteur WASM : reset/trajectoire, impulsions, sol, rebonds et maintien dans l’arène sur 4 graines × 8 directions × 30 s.
- Articles FR et EN : `/fr/blog/ball-thrust-physique-rapier` et `/en/blog/ball-thrust-physique-rapier`, avec métadonnées, captures réelles, code injecté depuis la source et explication des limites avant le lot RL.
- Intégration au catalogue/build statique et lien fonctionnel `/demos/ball-thrust/` ; respect de `DEMO_BASE` pour les assets Vite.
- Un test de raccordement du blog vérifie les deux traductions, les sources, les images et le catalogue.
- Aucun ajout de bibliothèque/version ; aucune modification des packages RL protégés.

## Validation finale

- [x] `pnpm test` : builds récursifs réussis ; **458 tests passent, 3 ignorés** faute de `HF_TOKEN`.
- [x] `pnpm run typecheck` et `pnpm --filter demo-ball-thrust typecheck`.
- [x] Blog réel EN/FR : navigation depuis les listes, titres/métadonnées, code, images, 390 × 844 sans débordement, lien vers la démo, clavier et reset ; aucune erreur console/page.
- [x] Démo embarquée : huit directions, inertie/no-op, collisions/rebonds, mur, cible atteinte au clavier, resets, orbite, focus et repli WebGL.
- [x] Mesure en mouvement sur 30 s, Chrome avec fenêtre / Apple M4 : **120,02 FPS RAF**, p95 **9,1 ms**, aucune erreur console/page.

Preuves complètes : `evidence/67b37dfe945b2af9554c9c7e83d227f35b0d4ceb/README.md`. Les premières preuves physiques restent dans `evidence/d79341e1665c6413992378ce775941d909b45d32/`.

## Limites et diagnostics conservés

- Pas d’agent, récompense ou contrat RL anticipé dans le lot 1/3 ; contrôle clavier, pas de contrôleur tactile ou promesse de performance mobile.
- Avertissement Rapier 0.15.0, taille de bundle et diagnostics historiques Nextra/Next conservés dans les logs. Les quatre diagnostics de locale sont déjà présents avant les articles et ne font pas échouer le build ; les routes nouvelles ont été validées réellement.
- Les préchargements Next annulés lors de la navigation sont consignés séparément, sans filtrage des erreurs console/page.
- Les essais intermédiaires et leur résolution sont conservés avec la validation finale.

## Intégration

PR préparée localement, sans push ni merge. Le propriétaire publie la branche et fusionne après revue. La mention `Closes #70` permettra la clôture à la fusion ; aucune clôture anticipée ni modification d’autres tickets par l’agent.
