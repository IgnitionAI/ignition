# IGN-118 — scène livrée au pilote

Base `52974ec126fd5ee45f08420f01a4aaca38395cbb`, branche `feat/ign-118-space-dock`.
Intégration hangar selon PLAN-HANGAR-VALIDATION.md du 2026-11-08, qui remplace
l’ancienne allocation du worktree visuel. Scene est déjà reliée au jeu par
scene-adapter. Interface conservée : `{ env: SpaceDockEnv; compact: boolean; reducedMotion: boolean }`.

## Lecture de la simulation

Seule Scene lit les corps : `env.drone/cargo.translation()/rotation()` chaque frame,
sans conserver de corps entre frames. `env.generation`, `goal`, `solids` et `telemetry`
alimentent le rendu. Aucun step, monde, force ou pose physique créée par le rendu.
Le callback World de priorité −1 copie les poses et les signaux avant les callbacks
visuels de priorité 0. Aucune publication React ajoutée par frame ; le résumé DOM lit le snapshot courant à chaque rendu Scene (publication App existante pour ticks/reset), sans timer ni corps conservé.
Les modèles de repli restent dans les mêmes groupes de pose que les GLB.

## Adaptation mesurée des originaux

Les échelles initiales .5 (drone) et .65 (cargo) n'étaient pas suffisantes :
largeur drone 1.643 m et hauteur cargo 1.469 m dépassaient les volumes techniques.
`adaptModel` ajoute une correction par axe après orientation et recentre le bounding box
sur le groupe de pose physique. Les nœuds et leurs pivots restent intacts dans le GLB.
Cette correction non uniforme affecte les proportions ; son acceptabilité visuelle reste
à recetter. Aucun original réexporté.

| Modèle | Orientation / dimensions finales X,Y,Z au repos | Position / pivot |
|---|---|---|
| Drone | yaw −π/2, avant −Z → +X ; 1.568 × .784 × 1.176 m | bbox centrée (0,0,0), dans 1.6 × .8 × 1.2 m |
| Cargo | pas de rotation asset ; 2 × 1.2 × 1.6 m | bbox centrée (0,0,0) |
| Berth | yaw −π/2, échelle 1 | `(goal.x, -.65, goal.z)` ; anneau local z=0 → x=6 ; paroi z=−4.5 → x=10.5 |

La marge drone de 2 % contient le balayage `ClampClose` vérifié sur 21 échantillons.
Les tests contrôlent min/max, taille, rotation du groupe physique et axes X/Y/Z.
Le sol (y=−.76), les panneaux, rails et la liaison fixe sont décoratifs sans collider.
La liaison droite couvre .5 m entre les coques nominales, le point d'ancrage drone
reste x=−1.05 ; aucune animation de grappling n'est suggérée comme action physique.

## Signaux et animations

- Actions 1/2 : ThrusterCore/RetroCore ; 3/4 : LateralCore_R/L.
- Actions 5/6 : balise cyan/violet, depuis le signe du couple réellement appliqué.
- Action 7 : balise ambre générique ; pas de direction de frein inventée ni toutes les tuyères allumées.
- Contacts cumulés : témoin rouge général sur le drone, aucun impact local inventé.
- Berth ambre, vert seulement si `outcome === 'success'`. Aucune progression inventée.
- `DockLock` inactif jusqu'au succès. `ClampClose` illustre la liaison déjà établie.
- Generation arrête/restaure les bindings du mixer puis applique l'état courant,
  efface l'énergie contact et remet immédiatement les intensités cohérentes.
- Reduced-motion : état final immédiat des clips actifs, couleurs sans interpolation,
  caméra sans lissage et aucune pulsation. Les poses physiques restent visibles.

`DockLock` termine sur la quaternion d'origine du GLB : le test réel compare ses
clés, son mouvement intermédiaire et la restauration de sa pose au reset. Une pose
finale différente de la pose originale n'est pas présumée.

## Propriété et cycle de vie

Pas de cache global GLB ni clone de scène partagé : chaque requête possède son arbre.
`createLoadSlot` attache et détache les objets ; une réponse tardive est disposée
sans préparation, setState ou rattachement. `ownModel` capture les géométries typées
`Set<BufferGeometry>`, les matériaux originaux, clones par mesh et textures partagées.
Les signaux ne créent plus de clones. Les textures, matériaux et géométries sont
libérés une fois par owner avec déduplication. Le mixer s'arrête et uncache son root
avant libération des ressources. `dispose={null}` empêche R3F de libérer cet arbre
possédé manuellement. Lors d'un swap, l'ancien adaptateur est détaché avant disposal.
Les primitives déclaratives et leurs matériaux sont possédés par R3F ; les géométries
RoundedBox allouées par Panel ont un cleanup explicite.

Le test de lifecycle utilise de vrais Mesh, Geometry, Material, Texture et leurs
événements `dispose`, pas des ressources simulées. Il ne constitue pas un test de
remontage React, ni une mesure GPU.

## Rendu et accessibilité à recetter

Canvas R3F, tone mapping ACES, aucun composer. DPR borné 1–1.75 desktop,
1–1.25 compact ; une lumière directionnelle avec shadow map 1024² desktop et aucune
ombre portée compact. Caméra fixe trois-quarts dont le cadrage suit l'étendue cargo/but
et l'aspect du conteneur ; pas de nouvelle commande ou orbite interactive.
Résumé DOM, légende et fallback GLB **NONFINAL** visibles. Fallback WebGL accessible,
perte de contexte traitée, aucun overlay plein écran de chargement. Le chargement
n'est indiqué qu'après création du canvas et s'arrête lors d'une erreur WebGL.

## Hangar statique intégré

World rend StaticHangar en plus du sol et des solides existants. Le GLB figé
c004741d… reste en coordonnées monde, position et rotation nulles, échelle 1.
Aucun adaptateur mécanique, mixer, useFrame ou lien physique pour ce décor.
createHangarLoad utilise createLoadSlot/ownModel existants : chaque requête
possède son arbre, les réponses tardives sont disposées sans attachement ni statut,
et close détache/libère de façon idempotente. R3F reçoit dispose={null}.
Le changement compact remplace l'owner ; le mode réduit ne déclenche aucune
animation du hangar. Aucun cache ni arbre partagé.

Les matériaux originaux du GLB restent inchangés sur disque ; les instances
isolées par ownModel conservent depthTest et renderOrder par défaut. Le hangar
reçoit les ombres ; il en porte seulement hors compact. Aucun nouveau projecteur,
composer ou texture. Les bornes DPR/ombres sont conservées ; la caméra desktop reste identique, le cadrage compact est décrit ci-dessous. Sol y=−.76 conservé ; plaques/marquages
exportés du hangar conservés exactement, sans transformation corrective.

Scene possède un statut séparé loading/ready/NONFINAL pour le hangar. Sa ligne
DOM est présente seulement quand graphics=available. Un échec laisse un décor
incomplet explicitement NONFINAL, sans faux hangar géométrique. Les statuts
des trois modèles mécaniques restent indépendants. Le cycle WebGL canonique
checking/available/failed/lost, sa racine createRoot, ses catches et alertes DOM
restent conservés. Aucun chargement World sur refus graphique.

## Preuves actuelles et limites

Voir ../proofs/hangar-integration/RESULT.md : 22 tests visuels (16 préexistants
intacts + 6 nouveaux), 23 techniques, typecheck intégré et build Vite avec
DEMO_BASE=/demos/space-dock/ passent. Tests GLTFLoader réels : hash, bbox,
triangles, identité des transformations, propriété/late/dispose/statuts, HTML SSR.
Le corridor nominal X[−8.01,9.11], Y[−.6,.6], Z[−.8,.8] ne rencontre aucun triangle
du hangar : contrôle géométrique limité au trajet rectiligne, pas à toutes les
manœuvres permises ou à une visibilité en pixels. Les fonds et équipements
périphériques sont décoratifs sans colliders ; leur lecture visuelle reste à recetter.

**3D/perf NOTPROVEN** : aucune voie de rendu 3D autorisée, aucun serveur,
navigateur, GUI, SwiftShader ou capture. Lisibilité départ/approche/succès, occultations,
z-fighting, cadrage desktop/mobile, matériaux, ombres, remontage React réel, réseau,
GPU, draw calls et frame times ne sont pas prouvés par Node/SSR/build.
Les preuves antérieures et captures de l'équipe sont historiques ou assets seulement.
Le dist nouvellement produit est distinct de webgl-fix/artifact figé pour QA.

Le mode AUTO DÉMO conserve le PD scripté, NON ENTRAÎNÉ ; aucune convergence
ou performance apprise revendiquée. Réserve licence/titulaire #45 toujours ouverte,
sans attribution inventée : voir ASSETS.md.

## Correction mobile V1 — reprise autorisée du 2026-11-08

Correctif statique à recetter : ../proofs/mobile-reprise/RESULT.md. Aucun nouveau
rendu navigateur ni visa esthétique mobile. Les captures App de la recette
précédente restent des preuves historiques du précédent artefact seulement.

Desktop : FOV43 et équations exactes conservées, cible X milieu min/max des centres
cargo/drone/but, Y0, Z(cargo.z+drone.z)/4 ; distance=max(19,span/aspect*1.25),
span=max(10,abs(goal.x-cargo.x)+5), offset=(-.24,.82,.66)*distance.
Compact : FOV48, cible basse Y.3, direction normalisée (-.85,.34,.4), distance
résolue dans la base caméra à partir des huit coins de chaque enveloppe et des
deux demi-angles perspective. Marge NDC .88 (6% de chaque bord). Aucune distance
fixe 19 en compact. Rayon XZ cargo=hypot(1,.8), drone=hypot(.8,.6) : enveloppes
collider contenant les assets et leurs lacets ; berth local X[-4.51,4.67],
Y[-1,5.21], Z[-5.01,5.01], décalage de pont inclus, contient le vrai GLB.
Le hangar architectural ne définit pas le fit. Aucun objet ni but réduit.
Lissage position delta*5, saut sur generation et reducedMotion conservés.
ResizeObserver mesure désormais le conteneur canvas flexible, met à jour R3F ;
le helper recalcule avec cette taille. DPR, clipping .1/160 inchangés.

Compact : résumé natif details/summary fermé, une ligne de 24px + 4px de padding,
dans le flux sous le canvas, avec détails défilables limités à 50% du conteneur.
Aucune couche de détails ne couvre le groupe. NONFINAL reste hors du volet ;
WebGL failed/lost reste dans GraphicsSurface, hors canvas et hors volet.
Le statut hangar ready/loading reste conditionné à graphics=available, visible
à l'ouverture des détails. Desktop conserve son panneau lisible superposé.
Le résumé prend outcome/contacts/action du snapshot courant, donc aucun délai
propre de 300ms après reset ; test réel WASM + SSR avant/après reset.
La disparition de la réserve 500ms est prouvée au rendu DOM SSR, pas encore
constatée en navigateur monté ; clavier/focus et zoom réels restent à recetter.

Les tests projettent avec PerspectiveCamera Three les GLB adaptés, l'union des
bounds de clips à 21 temps et les colliders sur trois axes / lacets 0,45,90°.
Fixtures de TESTS : départ cargo(-7,0,0), drone(-4.7,0,0), but(6,0,0) ; trajet
cargo0/drone2.3 ; succès cargo6/drone8.3 ; limite de contact dock-back cargo7.2/
drone9.5 (face intérieure X10.3). Fixture supplémentaire cargo6.46/drone8.76
approxime seulement la distance HUD .46m de la capture contact : aucun XYZ exact
n'était enregistré, aucun replay physique ni pose observée exacte revendiqué.
Les mesures ci-dessous sont des rectangles d'enveloppes projetées (union des
lacets/animations), pas les pixels de silhouettes rendues ou la lisibilité.

| Surface de projection testée | Cargo ancien → V1, px W×H | Drone ancien → V1, px W×H |
|---|---|---|
| 364×320, surface mobile historique | 44.27×43.09 → 91.25×79.87 | 30.82×31.42 → 57.72×45.54 |
| 364×292, allocation fermée V1 attendue | 42.52×41.09 → 89.53×78.64 | 29.45×29.92 → 55.72×44.16 |
| 390×600, fixture portrait | 42.24×44.32 → 69.41×57.56 | 31.33×32.76 → 49.63×37.46 |
| 600×320, fixture paysage | 46.60×45.03 → 98.11×86.18 | 32.27×32.79 → 61.06×48.39 |

La surface historique réelle 364×320 vient de la capture mobile390×844 (marges
et bordure App). 364×292 est l'allocation CSS attendue après réservation de28px,
non une nouvelle mesure navigateur. Portrait/paysage ci-dessus sont des tailles
canvas explicites de tests, pas des dimensions de téléphone certifiées. Le cas
364×160 couvre aussi un volet ouvert occupant la moitié du conteneur. Tous les
coins testés restent |NDC x/y|≤.9 et dans le clipping. Les augmentations de taille
ne prouvent ni occultation ni esthétique universelle ; transitions lissées, autres
trajectoires, contacts exacts, rendu et focus mobile restent NON PROUVÉS.

26 tests visuels (22 existants intacts +4 nouveaux), 23 techniques, tsc intégré et
build DEMO_BASE sont consignés dans la reprise. M1/graphicsLifecycle et physique
inchangés. Réserves M1 entre images, blur, GPU, licence45 et lock/frozen ouvertes.
