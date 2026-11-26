# Assets dock spatial — origine, licence et budget

Tous les modèles sont des **créations originales pour IgnitionAI**, produites localement par `source/build-assets.mjs` avec Three.js 0.162.0 et `GLTFExporter`. Aucune texture tierce et aucun asset importé d'un service externe. Aucun personnage riggé nécessaire.

Licence : les quatre modèles originaux sont couverts par la licence MIT de `IgnitionAI/ignition`. Copyright (c) 2025-2026 Salim Laimeche / IgnitionAI. Le texte applicable est dans `LICENSE` à la racine du dépôt et dans `public/models/LICENSE.txt` pour la distribution statique. Titulaire confirmé par le mainteneur dans https://github.com/IgnitionAI/ignition/issues/45#issuecomment-5989916644 ; années 2025-2026 déduites de l’historique du dépôt au commit `8e1a174`, non présentées comme une citation du mainteneur. Aucun asset privé ou tiers n’est relicencié.

## Fichiers livrés

| Asset | Octets | Triangles | Meshes | SHA-256 |
|---|---:|---:|---:|---|
| `drone-remorqueur.glb` | 227 860 | 10 448 | 21 | `57f7fe737076b54ce7ae5ca48d8e45b2321076339c29189d79387dcacb3a7dce` |
| `cargo-orbitale.glb` | 237 016 | 12 636 | 6 | `e50162c7553895bde65debeac279aab32f8020d007d73fa71b2f8c4e223f4297` |
| `poste-arrimage.glb` | 331 240 | 16 684 | 12 | `f5b0432ffc9117700383b932d9735ea0b8c75871b414653109cd46a1e06bad50` |
| `hangar-orbital.glb` | 636 036 | 26 430 | 10 | `da6076c750b128f0c8ccdbcdbfcc2f8738969da3774328d0827e88eae8ac68e9` |
| **Total** | **1 432 152** | **66 198** | **49** | — |

Budget sans compression Draco/Meshopt : **1,43 Mo**, aucune texture image. Les sommets identiques sont soudés et indexés (`gltf-transform weld`), à géométrie inchangée. Les détails visibles sont de la géométrie chanfreinée et des matériaux PBR, pas des primitives de fallback. Les meshes statiques sont fusionnés par matériau ; les pivots mécaniques et les tuyères d’action restent séparés. Le berth est aligné pour anneau `x=6` et paroi `x=10,5` après rotation d’intégration.

## Conventions

- Unités : mètres ; Y up ; drone orienté vers **−Z**.
- Origine drone : centre de coque ; `TowSocket` à l’arrière pour la liaison.
- Origine cargo : centre du container, dimensions hors cadre environ 2,6 × 2 × 2,2 m.
- Origine berth : centre du deck, approche depuis +Z vers −Z, anneau au sol.
- Matériaux : graphite/acier/ocre/ivoire, émissifs cyan/ambre/vert/rouge. Aucune texture ou police à charger.

## Animations mécaniques nodales

- Drone : `ClampOpen`, `ClampClose`, 1 s, pivots `ClampPivot_L` / `ClampPivot_R`.
- Dock : `DockLock`, 1 s, pivots `DockClampPivot_L` / `DockClampPivot_R`.
- Cargo : aucune animation, conformément à son rôle.

Ces clips ne simulent ni contact ni réussite. L’intégration doit les déclencher depuis l’état physique réel et les réinitialiser au reset.

## Validation et reproduction

```bash
node source/build-assets.mjs
node source/validate-assets.mjs
```

`assets/validation.json` : **0 erreur et 0 avertissement** pour les trois fichiers avec `gltf-validator`. Le validateur signale seulement à la console l’extension émissive optionnelle non reconnue par sa version ; aucun finding dans le rapport.

Une prévisualisation indépendante, sans physique, a servi aux captures internes. Les GLB doivent encore être recettés dans la démo R3F/Rapier intégrée ; cette prévisualisation ne prouve ni gameplay ni apprentissage.

## Audit du 2026-11-08 — instances et réserve

Les trois SHA-256 ci-dessus ont été recalculés localement et sont identiques.
Les GLB restent originaux, sans régénération. Source de provenance consultée : le script de génération procédurale
Three.js/GLTFExporter (`build-assets.mjs`) du pipeline d'assets interne.
Les commandes de reproduction précédentes sont historiques et relatives à ce pipeline,
pas des commandes exécutées dans ce package. `public/models/validation.json` est le
rapport fourni en amont ; gltf-validator n'a pas été relancé ici.

La licence MIT est formalisée au commit `8e1a174` : Copyright (c) 2025-2026
Salim Laimeche / IgnitionAI. Le titulaire est confirmé par le mainteneur ; les années sont
déduites de l’historique. Voir la licence racine et `public/models/LICENSE.txt`.

Mesures nouvelles avec GLTFLoader/Box3 Three 0.162.0 : le drone après .5 et yaw −π/2
mesure 1.50625 × .705 × 1.643 m ; le cargo après .65 mesure 1.781 × 1.469 × 1.5795 m
(ordre X,Y,Z). Les dimensions indicatives plus haut ne prouvaient donc pas l'enveloppe.
Adaptation des instances uniquement : recentrage bbox et correction par axe vers
1.568 × .784 × 1.176 m (drone, marge mécanique 2 %) et 2 × 1.2 × 1.6 m (cargo).
Le berth conserve échelle 1, rotation −π/2 et deck y=−.65.
Détails : `docs/DOCK-VISUAL.md`.
La correction non uniforme des proportions reste à valider visuellement.

## Hangar intégré — entrée figée du 2026-11-08

Le GLB est copié exactement depuis l'entrée figée `hangar-input/hangar-orbital.glb`
du pipeline d'assets interne.
Le hash c004741d… remplace définitivement la version 045db632. Le dossier
`hangar-input/` contient ASSETS.md, INPUT.json, validation.json et le source
`build-assets.mjs` figés ; aucune génération ni validation gltf-validator relancée.
INPUT.json indique la provenance initiale : la sortie `assets/hangar-orbital.glb`
du même pipeline.
Les trois anciens GLB et leur rapport public de validation sont conservés.
Le rapport figé amont annonce 0 erreur / 0 avertissement pour les quatre GLB ;
cette déclaration héritée est distincte de la lecture Three actuelle.

Hangar original : coque architecturale 32×18 m, portiques arrière, fenêtre orbitale,
planète et étoiles géométriques, passerelle/escalier, réseaux et réservoirs, grue,
ventilation, plaques de sol et circulation. Côtés proches caméra ouverts, fermes
raccourcies vers l'arrière. Son bbox global inclut le fond orbital et ne décrit
pas le volume navigable : min (−18.025, −3.705, −40.0466),
max (17.660225, 14.869, 9.6), mesuré par GLTFLoader/Box3.

L'instance statique est ajoutée au vrai World R3F à l'identité, sans adaptation,
clip, collider ni interaction physique. 10 meshes et 26 430 triangles mesurés
dans le vrai GLB avec Three 0.162.0. Les 66 198 triangles / 49 meshes / 1 432 152
octets sont les totaux des fichiers, pas une mesure des appels de rendu ou du GPU.
Aucune texture image externe ; aucun achat ni nouvelle dépendance. Les captures
amont d'assets ne prouvent pas l'intégration. Licence MIT et attribution comme ci-dessus.
Voir `docs/DOCK-VISUAL.md` pour l'état actuel de la vérification et ses limites.
