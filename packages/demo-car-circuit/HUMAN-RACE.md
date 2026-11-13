# Recette humaine GPU — IGN-221 / GitHub #17

**Statut de cette recette sur machine GPU navigateur : NON VÉRIFIÉE.**

Cette procédure ne réentraîne rien, n’ajoute aucun asset, et n’autorise pas un contrôleur à règles à la place d’un pilote appris.

## Préparation

Depuis la racine du dépôt, sur `cursor/circuit-human-race` ou le SHA de la PR :

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter demo-car-circuit dev -- --host 127.0.0.1
```

Ouvrir l’URL Vite affichée (port 3020 par défaut) dans un navigateur desktop **avec GPU** (Chrome/Chromium ou Firefox récents). Ne pas utiliser uniquement SwiftShader pour cette recette.

## Parcours

1. En-tête → **Course**. Le garage doit lister au moins Formule R (`race.glb`) et Sport GT (`sedan-sports.glb`).
2. Mode **Jouer contre les IA**. Véhicule joueur : **Sport GT**. Un adversaire : checkpoint fourni **Imitation 29** (`bundled-29`).
3. **Prendre le départ**. Compte à rebours 3 s, puis conduite clavier : ↑/Z/W accélérer, ↓/S freiner, ← → / Q D tourner. Échap pause ; perdre le focus doit pauser. Mini-carte, vitesse, tour, position et chrono visibles.
4. Terminer **trois tours** contre le checkpoint nommé. Aucune substitution par une IA scriptée.
5. L’écran **Résultat** doit afficher l’identifiant `bundled-29`, les temps, pénalités et remises.
6. **Nouvelle course** ramène au garage. Relancer une course sans recharger la page.

## À consigner

- Navigateur, OS, GPU, résolution.
- Identifiant du checkpoint adverse, circuit (`alpine-park-v1`), contrat (`circuit-racing-v2`), règles (`circuit-race-v2-ghost-v1`).
- Temps, tours, pénalités, remises, classement.
- Comportement pause / reprise / nouvelle course.
- FPS ou temps de frame mesurés, sans promesse de 60 FPS.

## Parcours Playwright (SwiftShader, pas la recette GPU)

```sh
corepack pnpm --filter demo-car-circuit exec vite --host 127.0.0.1 --port 3020
CIRCUIT_URL=http://127.0.0.1:3020 corepack pnpm --filter demo-car-circuit e2e:human-race
```

Artifacts: `evidence/ign-221/`. The player slot is completed with frozen imitation-11 after real keyboard/pause checks.

## Ce que cette PR a déjà prouvé

- Tests de simulation : course humaine contre checkpoint figé, poids inchangés, checkpoints ordonnés, égalités, erreurs de chargement.
- Playwright (SwiftShader / CPU WebGL) : garage → clavier → pause → arrivée via politique **apprise** figée sur le slot joueur → résultats → nouvelle course. Ce n’est **pas** la recette GPU humaine.
