# Rapport de vérification — intégration @ignitionai/viz (issues #74/#75)

- Repo : `/Users/salimlaimeche/dev/ignition`
- Branche : `feat/75-demo-viz-integration` — HEAD `106a239` (confirmé via `git rev-parse --short HEAD`)
- Date : 2026-10-18
- Mode : strictement lecture seule (aucun edit source, aucun commit). Seuls ajouts : captures PNG et ce rapport sous `specs/74-viz-interface/review/`.

## Verdict global : 6/6 PASS

| # | Critère | Verdict | Preuve |
|---|---------|---------|--------|
| 1 | `pnpm --filter @ignitionai/viz build` exit 0 | **PASS** | commande exécutée, `EXIT=0` (tsc, pas d'erreur) |
| 2 | `pnpm build` (packages/demo-target-chasing) exit 0 | **PASS** | commande exécutée, `EXIT=0` (`✓ built in 2.73s`, 1943 modules) |
| 3 | `pnpm vitest run packages/viz packages/demo-target-chasing` 4/4 verts | **PASS** | `Test Files 2 passed (2) / Tests 4 passed (4)`, `EXIT=0` |
| 4 | Rendu navigateur réel du MetricsDashboard | **PASS** | captures + détails ci-dessous |
| 5 | Diff limité aux dossiers autorisés | **PASS** | `git diff 323fa68...HEAD --stat` ne touche que `packages/viz`, `packages/demo-target-chasing`, `specs/74-viz-interface/`, `pnpm-lock.yaml` |
| 6 | Aucune modification du code par le vérificateur | **PASS** | `git status` inchangé hors `specs/74-viz-interface/review/` (captures + rapport) |

## Détail critère 1 — build @ignitionai/viz

```
$ pnpm --filter @ignitionai/viz build
> @ignitionai/viz@0.1.0 build /Users/salimlaimeche/dev/ignition/packages/viz
> tsc
EXIT=0
```

## Détail critère 2 — build démo

```
$ cd packages/demo-target-chasing && pnpm build
✓ 1943 modules transformed.
../dist/index.html  0.45 kB
../dist/assets/index-JHS_k9kx.js  3,002.78 kB
✓ built in 2.73s
EXIT=0
```

Notes (warnings non bloquants, pré-existants hors périmètre du diff) :
- `saveModelToHub.ts` : imports Node (`writeFileSync`, `join`, `readFileSync`) non exportés par `__vite-browser-external` — warning Rollup, build OK.
- Chunk > 500 kB (avertissement taille).
- Le contournement attendu (`build` + `preview`) fonctionne : le `vite preview` sert `dist` sur le port **4173** (le `server.port: 3000` du `vite.config.ts` ne s'applique pas au preview ; le port réel observé est le défaut Vite 4173, HTTP 200 vérifié par `curl`).

## Détail critère 3 — tests

```
$ pnpm vitest run packages/viz packages/demo-target-chasing
 ✓ packages/demo-target-chasing/src/episodeTracker.test.ts (1 test)
 ✓ packages/viz/src/store.test.ts (3 tests)
 Test Files  2 passed (2)
 Tests  4 passed (4)
EXIT=0
```

## Détail critère 4 — rendu navigateur réel

Méthode : `pnpm build` puis `pnpm preview` (tourne en tâche de fond, log `/tmp/viz-preview.log`), puis script Playwright (`playwright-core@1.64.1`, navigateur headless Chromium depuis le cache `~/Library/Caches/ms-playwright/chromium_headless_shell-1243/`, viewport 1400×900). Attente de 25 s après `load` pour l'accumulation des TrainingFrames, clic sur l'onglet « Inference », attente 2 s, seconde capture. Script : `/tmp/pwtest/capture.mjs`. Code retour du script : `EXIT=0`.

Capture Training (`/tmp/viz-verify-training.png`, copiée vers `specs/74-viz-interface/review/viz-verify-training.png`) :
- Onglets **Training** (actif) / **Inference** présents.
- StatCards : Épisode **3**, Reward **14.00**, Best reward **35.22**, Succès (100 derniers) **100 %**.
- Courbe **« Reward par épisode »** tracée avec 3 points (36 → ~12 → ~14).
- Le sketch 3D R3F (grille, sphères bleue/rouge) continue de s'afficher derrière le panneau.

Capture Inference (`/tmp/viz-verify-inference.png`, copiée vers `specs/74-viz-interface/review/viz-verify-inference.png`) :
- Onglet **Inference** actif, état vide attendu : Step **0**, Dernière action **—**, Reward cumulé **0.00** (la démo n'a pas de mode inférence — conforme au périmètre).

Erreurs console : **aucune**. Warnings uniquement :
- `⚠️ VITE_HF_TOKEN non trouvé. Les checkpoints ne seront pas sauvegardés.` (comportement applicatif prévu sans token)
- Warnings WebGL de performance `GPU stall due to ReadPixels` (headless + canvas TF.js/R3F, non liés à l'intégration viz)

## Détail critère 5 — périmètre du diff

```
$ git diff 323fa68...HEAD --stat
 packages/demo-target-chasing/...  (6 fichiers)
 packages/viz/...                 (11 fichiers)
 pnpm-lock.yaml
 specs/74-viz-interface/plan.md
 specs/74-viz-interface/spec.md
```

Aucun fichier hors `packages/viz`, `packages/demo-target-chasing`, `specs/`, `pnpm-lock.yaml`. PASS.

## Observations (sans correction, conformément à la mission)

1. Avertissement `define: { 'process.env': process.env }` au lancement de `vite preview` : exposition potentielle des variables d'environnement dans le bundle — pré-existant, hors diff.
2. Warnings Rollup `__vite-browser-external` sur `saveModelToHub.ts` (imports Node dans un bundle navigateur) — pré-existants, hors diff, non bloquants.
3. Le dashboard Training affiche « Succès (100 derniers) 100 % » dès le 3ᵉ épisode — logique d'affichage à confirmer par le reviewer métier si pertinent (cohérent avec un taux calculé sur les épisodes disponibles).
4. `pnpm dlx playwright@1.64.1` exige le navigateur `chromium_headless_shell-1248` absent du cache ; contourné en pointant `executablePath` vers le `chromium_headless_shell-1243` déjà en cache. Sans impact sur la validité des captures.

## Fichiers produits par cette vérification

- `/Users/salimlaimeche/dev/ignition/specs/74-viz-interface/review/viz-verify-training.png`
- `/Users/salimlaimeche/dev/ignition/specs/74-viz-interface/review/viz-verify-inference.png`
- `/Users/salimlaimeche/dev/ignition/specs/74-viz-interface/review/REVIEW-VERIFY.md` (ce rapport)
- `/tmp/pwtest/capture.mjs` (script de capture, hors repo)
- `/tmp/viz-preview.log` (log du serveur preview, hors repo)
