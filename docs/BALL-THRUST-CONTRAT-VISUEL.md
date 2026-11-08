# Ball Thrust — contrat de passe visuelle

Cible : ignitionai.dev, monorepo `IgnitionAI/ignition`. Base `52974ec`. Cette passe ne migre ni Night Lords ni la PR #49.

## Scène et interaction existantes

Ball Thrust reste la même démo : une sphère de 1 kg dans une arène de 12 m, propulsée par impulsions Rapier au clavier, avec obstacles et but. `BallThrustEnv` est l’unique horloge physique. Aucun changement à `physics.ts`, `ball-thrust-env.ts`, aux actions, observations, récompenses, entraînement ou persistance.

## Direction visuelle

**Le réacteur.** Une sphère d’énergie cyan traverse une cage industrielle originale vers une balise vert citron. L’utilisateur doit lire en une image : la balle, sa vitesse, les obstacles et la cible.

- Sujet : sphère cyan, matériau métallique, noyau émissif et traînée courte liée à sa vitesse réelle.
- Menace : obstacles en métal sombre avec arêtes ambre, jamais des boîtes orange uniformes.
- But : anneau vert, colonne lumineuse discrète et pulse lent ; aucune géométrie ajoutée au monde physique.
- Lieu : cage Blender originale du monorepo, deck riveté, membrures, lumières froides et accents chauds.
- Caméra : lisibilité du jeu conservée, orbite/zoom existants ; cadrage portrait corrigé sans changer les entrées.

Palette : fond `#071018`, acier `#243642`, cyan `#58d9e8`, vert `#b7ee76`, ambre `#d98b4a`. ACES, exposition fixe, bloom limité aux émissifs. Pas de grain camouflant les matériaux.

## Assets et licence

Réutiliser `demo-cage-duel/public/models/cage-blender.glb`, géométrie originale créée dans Blender et documentée dans `demo-cage-duel/art/README.md`, couverte par le dépôt MIT après vérification du fichier et de sa provenance. Copie locale au paquet avec note de provenance, aucun asset Genex/GW/payant et aucune nouvelle génération. Si le GLB manque, l’arène construite reste visible et jouable.

## Frontière technique

- Modifications visuelles : `Scene.tsx`, éventuellement `styles.css` et assets publics/documentations/tests de rendu.
- Aucun changement de simulation, d’état RL ou de contrat `TrainingEnv`.
- La position et la rotation de la sphère continuent de copier `env.ball` dans `useFrame`.
- Traînée/effets dérivés des positions réelles, sans avancer Rapier et sans modifier le corps.
- Postprocessing sélectionnable/repli : DPR desktop ≤ 1,5, mobile 1 ; ombres réduites ; reduced-motion supprime pulses et traînée non essentielle.
- OrbitControls et zoom ne changent jamais les actions.

## Preuves et critères de captures

Référence avant : mêmes graine/mode et viewports 1440×900, 390×844. Après : mêmes cadrages, sphère + obstacles + but visibles, HUD non masqué.

- Exécuter les contrôles clavier existants et vérifier déplacement/collisions via l’état Rapier, pas seulement la différence d’image.
- Captures avant/après, mobile simulé, reduced-motion et GLB absent.
- Console sans nouvelle erreur ; WebGL refusé conserve son message.
- Tests paquet + typecheck + build, puis build catalogue web sans casser les autres démos.
- SHA, versions, backend, DPR, appareil, draw calls/triangles/textures, frame times médiane/p95/p99 sur une fenêtre déclarée. SwiftShader n’est pas un GPU et ne prouve pas 60 fps.

## Tutoriel associé

Nouvel angle distinct de l’article DQN existant : **« Rendre une impulsion lisible dans R3F »**. Copier l’état Rapier dans le rendu, construire une traînée sans horloge parallèle, choisir les émissifs/bloom, conserver une caméra de jeu et mesurer le coût. Aucune promesse d’apprentissage ou de fluidité non mesurée.

Aucun déploiement/publication sans go Salim.
