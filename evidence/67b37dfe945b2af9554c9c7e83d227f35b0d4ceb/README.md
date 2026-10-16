# Ball Thrust — articles EN/FR et intégration web

## Source exécutée

- SHA : **`67b37dfe945b2af9554c9c7e83d227f35b0d4ceb`**.
- Branche : `feat/70-ball-thrust-3d`, dans le worktree `/Users/salimlaimeche/dev/ignition-demo-70-ball-thrust`.
- Article ajouté par `162f18b6b5a3576ba6505f5a3db37de4349cb21a`, puis compatibilité du test avec la cible TypeScript web corrigée par le SHA exécuté ci-dessus.
- Aucun diff de sources suivies avant validation (`environment.txt`). Le commit de preuves suivant ne modifie pas les sources testées.

## Réalisé

- `packages/web/blog/ball-thrust-physique-rapier.fr.mdx` et `.en.mdx` : commandes, impulsions, inertie, collisions, source de vérité Rapier, reset reproductible, protocole réel et limites avant le futur contrat RL.
- Métadonnées et référencement dans les listes de blog des deux langues ; même slug localisé sous `/fr/blog/ball-thrust-physique-rapier` et `/en/blog/ball-thrust-physique-rapier`.
- Deux captures réelles issues de la validation physique initiale, avec textes alternatifs localisés.
- Code de `physics.ts` chargé directement par le mécanisme de blog existant. Pas de copie divergente ni de faux exemple d’entraînement.
- Ajout au catalogue et au build statique existants : `/demos/ball-thrust/` fonctionne depuis chaque article. `DEMO_BASE` configure maintenant le chemin des assets Vite pour cette intégration.
- Descriptions EN/FR ajustées pour ne pas présenter Ball Thrust comme un agent déjà entraîné.
- Un test d’intégration vérifie les deux fichiers MDX, métadonnées, code injecté, images et entrée du catalogue.
- `demo-manifest.json` est le manifeste réellement produit : neuf démos, dont Ball Thrust, avec le SHA source final.

## Commandes et résultats

Depuis la racine du worktree, avec `GITHUB_SHA=67b37dfe945b2af9554c9c7e83d227f35b0d4ceb` pour identifier les démos embarquées :

| Commande | Résultat | Preuve |
| --- | --- | --- |
| `pnpm test` | **Code 0** ; builds récursifs, dont le site Next et ses démos, réussis ; **458 tests passent, 3 ignorés**, 61 fichiers passent | `pnpm-test.log` |
| `pnpm run typecheck` | **Code 0** | `root-typecheck.log` |
| `pnpm --filter demo-ball-thrust typecheck` | **Code 0** | `demo-typecheck.log` |
| Parcours blog EN/FR | **Code 0**, aucune erreur console/page ni réponse HTTP en échec | `blog-browser.log`, `blog-browser-metrics.json` |
| Parcours physique complet sur la route embarquée | **Code 0**, aucune erreur console/page | `embedded-demo-browser.log`, `browser-metrics.json` |

Les trois skips sont les intégrations Hugging Face sans `HF_TOKEN` ; aucune autorisation ou donnée de production n’a été utilisée. Les logs sont conservés avec leurs codes retour ; seuls les codes ANSI et espaces de fin de ligne ont été retirés.

Le build conserve quatre diagnostics historiques `Cannot destructure property 'locale'` provenant du parcours Nextra/Next. Le même nombre et le même message existent dans `evidence/d79341e1665c6413992378ce775941d909b45d32/pnpm-test.log`, avant l’ajout de cet article. Le build termine avec code 0 ; les deux routes d’article ont été contrôlées dans le navigateur. Les avertissements de taille de bundle, de localStorage et d’initialisation Rapier restent visibles. Aucun changement transversal du proxy ou de Nextra dans ce lot.

## Reproduire les parcours navigateur

Le serveur de validation sert le **build de production**, pas le serveur de développement :

```sh
pnpm --filter web start --hostname 127.0.0.1 --port 3071

export PLAYWRIGHT_PATH=/Users/salimlaimeche/.npm/_npx/9833c18b2d85bc59/node_modules/playwright
export CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export BLOG_URL=http://localhost:3071
export BALL_THRUST_URL=http://localhost:3071/demos/ball-thrust/

node evidence/67b37dfe945b2af9554c9c7e83d227f35b0d4ceb/blog-browser-check.cjs
node packages/demo-ball-thrust/test/browser-check.cjs evidence/67b37dfe945b2af9554c9c7e83d227f35b0d4ceb
```

Playwright et Chrome étaient déjà installés. Chrome 155 avec fenêtre, Apple M4 / ANGLE Metal, DPR 1, viewport desktop 1440 × 1100. Aucun flag de sécurité ou de désactivation vsync ajouté.

### Blog

Pour chaque langue : ouvrir la liste, cliquer l’article, vérifier son titre et sa métadonnée de page après résolution asynchrone, son attribut `lang`, sa mention explicite d’absence de réseau et le code source injecté ; attendre le chargement des deux images. Capturer la page entière et son en-tête. Vérifier à 390 × 844 l’absence de débordement horizontal, puis cliquer le lien « Essayer » / « Try ». Déplacer la sphère avec une vraie flèche clavier et vérifier le reset.

Les préchargements Next annulés lors d’une navigation (`net::ERR_ABORTED`, requêtes fetch) sont enregistrés séparément dans `cancelledRequests`. Ils ne sont pas des erreurs console ni des requêtes réseau échouées non annulées. Aucun message console d’erreur ou exception de page n’est filtré.

### Démo embarquée

Même recette que lors du lot physique, désormais sous le site web : impulsion/no-op, huit directions, trois resets identiques et graine différente, collision/rebond sur obstacle A, mur ouest, cible atteinte au clavier, orbite, blur, champ de graine, viewport étroit et refus de WebGL. Puis 30 s de poussées actives, directions alternées toutes les 3 s.

| Métrique | Valeur |
| --- | ---: |
| Durée RAF | 30 002,5 ms |
| Frames | 3601 |
| Cadence RAF moyenne | **120,02 FPS** |
| Médiane inter-frame | 8,3 ms |
| p95 | 9,1 ms |
| p99 | 9,3 ms |
| Temps physique écoulé | 30,0 s |

Mesure locale de cadence du rendu continu R3F, pas un temps GPU ni une garantie sur téléphone. Le monde physique reste à 60 Hz. Le viewport étroit est simulé, pas un appareil mobile réel.

## Captures

- `blog-fr.png`, `blog-en.png` : articles complets.
- `blog-fr-header.png`, `blog-en-header.png` : en-têtes lisibles des deux éditions.
- `blog-fr-narrow.png`, `blog-en-narrow.png` : viewport étroit.
- `01-initial.png` à `07-no-webgl.png` : parcours complet de la démo intégrée.

## Contrôles intermédiaires conservés

- `evidence/162f18b6b5a3576ba6505f5a3db37de4349cb21a/` conserve le premier typecheck en échec (`TS2802`), corrigé avant la validation finale.
- `preflight-127-*` conserve l’essai sur l’origine 127.0.0.1 : le proxy Next local génère des redirections vers localhost pour les préchargements, provoquant un mélange d’origines. La recette finale utilise l’origine localhost cohérente, sans modifier ni contourner les protections CORS.
- `preflight-cancellations*` conserve l’essai qui traitait à tort les préchargements annulés comme des échecs.
- `preflight-metadata*` conserve l’essai qui vérifiait le titre avant la fin des métadonnées asynchrones. Le script final attend explicitement le titre.

## Intégration et tickets

`PR.md` contient la description cumulée de la démo et du blog. Aucun push, merge, déploiement, publication ou clôture prématurée de ticket n’a été effectué. Les consignes réservent la fusion au propriétaire humain. Le ticket #70 reste ouvert en attendant son intégration ; aucun autre ticket n’est attribué à ce travail dans cette session.
