# Preuves — Ball Thrust 3D / ticket #70

## Identité de l’exécution

- **SHA source exécuté** : `d79341e1665c6413992378ce775941d909b45d32`.
- Branche : `feat/70-ball-thrust-3d`.
- Base imposée : `776dca6819d68d15b679c2338b327d6b78168222`.
- Worktree : `/Users/salimlaimeche/dev/ignition-demo-70-ball-thrust`.
- Les sources suivies étaient propres avant validation (`environment.txt`). Le commit suivant ajoute seulement ces preuves ; il ne change pas le code testé.
- La spec de ce lot est le ticket GitHub #70 ; aucun document Ball Thrust distinct n’existe dans `specs/` à la base imposée.

## Commandes et résultats

Toutes les commandes sont lancées à la racine de ce worktree. Les logs conservent la sortie et le code retour ; seuls les codes ANSI et espaces de fin de ligne ont été retirés pour la revue Git.

| Commande | Résultat | Sortie |
| --- | --- | --- |
| `pnpm install --offline --frozen-lockfile` | Code 0 ; réutilisation des dépendances résolues | `install.log` |
| `pnpm test` | Code 0 ; builds récursifs réussis, **60 fichiers passent / 3 ignorés**, **457 tests passent / 3 ignorés** | `pnpm-test.log` |
| `pnpm run typecheck` | Code 0 | `root-typecheck.log` |
| `pnpm --filter demo-ball-thrust test` | Code 0 ; **41 tests Rapier/WASM** | `demo-test.log` |
| `pnpm --filter demo-ball-thrust typecheck` | Code 0 | `demo-typecheck.log` |
| `pnpm --filter demo-ball-thrust build` | Code 0 | `demo-build.log` |
| `pnpm --filter demo-ball-thrust preview --host 127.0.0.1 --port 4170` | Build de production servi localement pour le parcours | `browser-command.txt` |
| `node packages/demo-ball-thrust/test/browser-check.cjs evidence/d79341e1665c6413992378ce775941d909b45d32` avec les variables décrites dans `browser-command.txt` | Code 0 ; tous les contrôles passent | `browser-run.log`, `browser-metrics.json` |

Les trois tests ignorés sont les intégrations Hugging Face `hubIntegration`, `checkpoint`, `trainer`, car `HF_TOKEN` est absent. Aucun secret n’a été fourni et aucun accès distant authentifié n’a été activé.

Avertissements non bloquants : initialisation WASM dépréciée dans Rapier 0.15.0 (dépendance existante), taille des bundles Vite, avertissements Nextra/Next et localStorage déjà émis par le build racine. La démo produit environ 1,08 Mo gzip, WASM inclus. Aucun avertissement n’est masqué et aucune nouvelle dépendance/version n’a été introduite ; le lockfile ajoute uniquement l’importer du package.

## Protocole physique

Le même `populateWorld` crée les corps dans les tests et dans le monde fourni par R3F Rapier. Pas de moteur simulé dans les tests.

1. Vérifier pose initiale, quaternion identité et vitesses linéaire/angulaire nulles. Comparer un monde neuf à un reset après mouvement, puis chaque état d’une trajectoire identique sur 240 pas.
2. Vérifier variation entre graines et rejet des graines hors uint32.
3. Appliquer des impulsions, constater que l’action seule ne change pas la position ; vérifier diagonales normalisées, cadence et no-op.
4. Vérifier gravité, support du sol et dissipation sans frein logiciel.
5. Sur chacune des graines **0, 70, 71, 4294967295**, maintenir chacune des **8 directions pendant 1800 pas = 30 s**. Vérifier x/z à chaque pas et le maintien sur le sol. Tolérance de pénétration transitoire du solveur : 3 cm, pas de clamp ni téléportation. Les contacts prédictifs sont réglés à 12 cm pour couvrir le déplacement d’un pas aux vitesses de l’arène.
6. Projeter la sphère vers chacun des trois obstacles dans une fixture de test : blocage et inversion de vitesse. Les `setTranslation`/`setLinvel` employés dans ces fixtures ne sont jamais employés par les commandes du jeu.
7. Vérifier cible, temps simulé et correspondances clavier/no-op.

## Protocole navigateur réel

Chrome **155.0.8059.41**, **avec fenêtre**, Apple M4, WebGL 2 / ANGLE Metal. Aucun flag de sécurité, de rendu logiciel ou de désactivation vsync ajouté. Desktop : 1440 × 1100 CSS px, DPR 1 ; viewport étroit simulé : 390 × 844, pas un appareil mobile réel.

Le script lit uniquement le HUD et pilote via de vrais événements clavier/souris Playwright. Aucun accès privé à Rapier, aucune modification de pose depuis le navigateur.

- Graine 70 : impulsion droite puis Espace tout en gardant droite enfoncée. L’inertie persiste et la vitesse décroît de 2,52 à 2,23 m/s.
- Trois resets avec la graine 70 : position affichée identique `(-4.32, 0.35, 4.44)`, vitesse nulle, chrono remis à zéro. Graine 71 : position différente.
- Vérification des huit directions au clavier.
- Obstacle A : x maximal observé −2,65 m, rebond confirmé.
- Mur ouest : sphère contenue à x = −5,65 m.
- Navigation jusqu’à la cible **uniquement au clavier**, contournement des obstacles par le côté ouest puis le couloir nord. Succès à 0,25 m de la cible ; la physique continue après succès.
- Glissement de la caméra orbite ; redimensionnement sans débordement ni découpage initial de l’arène.
- Perte de focus : arrêt des impulsions ; les flèches du champ de graine ne pilotent pas la sphère.
- Contexte WebGL refusé par interception de `getContext` : message textuel visible et aucune erreur console/page sur ce parcours non supporté.
- **0 erreur console, 0 exception page, 0 requête échouée** pendant le parcours supporté ; un avertissement d’initialisation Rapier est conservé dans le JSON.

### Mesure sur 30 secondes avec impulsions actives

Après reset, alterner haut/droite/bas/gauche toutes les 3 s pendant 30 s, vérifier les positions dans l’arène. Le navigateur échantillonne `requestAnimationFrame` pendant au moins 30 000 ms, au premier plan.

| Mesure | Valeur |
| --- | ---: |
| Fenêtre mesurée | 30 006,2 ms |
| Frames RAF | 3601 |
| Cadence moyenne | **120,01 FPS** |
| Temps inter-frame médian | 8,3 ms |
| p95 | 9,2 ms |
| p99 | 9,3 ms |
| Maximum | 9,4 ms |
| Temps physique écoulé | 30,0 s |

Ces valeurs mesurent la cadence RAF du rendu continu R3F, pas une requête GPU chronométrée ni une garantie multi-appareil. Le monde physique est à 60 Hz ; le rendu peut être plus fréquent. Les métriques détaillées et dix échantillons de télémétrie figurent dans `browser-metrics.json`.

## Captures

- `01-initial.png` — sphère, sol, quatre murs, trois obstacles, cible et HUD.
- `02-collision.png` — essai de contact avec l’obstacle A.
- `03-goal.png` — cible atteinte au clavier.
- `04-orbit.png` — vue après glissement de caméra.
- `05-narrow.png` — mise en page 390 × 844 simulée.
- `06-after-30s.png` — état après la mesure en mouvement.
- `07-no-webgl.png` — erreur textuelle quand WebGL est indisponible.

## Périmètre et limites

- Pas d’entraînement, réseau, récompenses ou abstraction RL prématurée : réservés aux lots suivants.
- Contrôle clavier seulement, pas de contrôleur tactile ; pas de claim de performance mobile.
- Déterminisme vérifié pour la version Rapier figée et les pas/actions identiques ; pas de promesse inter-version.
- Aucun push, merge, publication ou déploiement. Le board n’a pas été modifié : aucun outil `cogitator_board_*` n’est disponible dans cette session.
