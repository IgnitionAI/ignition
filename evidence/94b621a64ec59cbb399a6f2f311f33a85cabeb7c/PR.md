# feat(demo-ball-thrust): jeu physique Rapier, articles EN/FR et parsing GFM (#70)

Closes #70

Base : `776dca6819d68d15b679c2338b327d6b78168222` ; branche : `feat/70-ball-thrust-3d`.

Cette version complète la description cumulée conservée dans `evidence/67b37dfe945b2af9554c9c7e83d227f35b0d4ceb/PR.md` avec la correction signalée pendant la revue visuelle :

- Le blog interprète désormais les tableaux Markdown comme des tableaux HTML, et non du texte à pipes.
- Un même composant configure `remark-gfm` pour les routes génériques et la route dédiée CartPole ; coloration de code conservée.
- Dépendance 4.0.1 déjà résolue via Nextra, réutilisée sans nouvelle version.
- Régression compilant le HTML réel des articles FR/EN : un tableau, deux en-têtes, douze cellules.
- Régression navigateur : six lignes, FR/EN, desktop et 390 px, aucune erreur console/page ; route dédiée CartPole également vérifiée.

SHA source final exécuté : **`94b621a64ec59cbb399a6f2f311f33a85cabeb7c`**. Validation finale : `pnpm test` **459 réussis / 3 ignorés**, builds et typecheck verts. Les trois skips sont les intégrations Hugging Face sans token.

Preuves : `evidence/94b621a64ec59cbb399a6f2f311f33a85cabeb7c/README.md`, captures des quatre tableaux et journaux rouge/vert. La validation précédente ne vérifiait pas la structure du tableau ; ce contrôle est maintenant automatisé.

Aucun code physique modifié par cette correction. Aucun push, merge ou clôture anticipée : intégration et publication restent réservées au propriétaire humain.
