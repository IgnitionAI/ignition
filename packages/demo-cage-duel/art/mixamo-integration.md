# Blood Angel — animations Mixamo dans la cage

## Résultat

`http://127.0.0.1:3033/animations.html` charge désormais `blood-angel-mixamo.glb` : 48 animations issues de FBX Mixamo, transférées sur le squelette existant de 55 os du Blood Angel. Le squelette source comporte 65 os. Ce n'est pas un remplacement du modèle par X Bot ni une présentation des anciennes poses maison comme motion capture.

Sources privées : Pro Melee Axe Pack (43 clips hors sauts retenus sur les 47) et Pro Longbow Pack (quatre esquives et un poing). Les noms de fichiers, packs et SHA-256 figurent dans `mixamo-retarget-report.json`. Les 48 actions exportées doivent correspondre exactement au catalogue. Tous les originaux et les anciennes versions du personnage sont conservés.

## Essai utilisateur

- Catalogue filtrable : sélectionner chaque clip, rejouer, mettre en pause, boucler, ralentir ou déplacer le curseur temporel.
- ZQSD/WASD : marcher autour de la cible ; les quatre vitesses viennent du déplacement mesuré dans les FBX. Les clips de marche eux-mêmes sont exportés sur place.
- Flèches : choisir la direction du raccourci. 1 : revers, horizontale ou descendante selon gauche/droite/haut ; 2 : enchaînement Mixamo ; 3 : poing ; 4 : esquive directionnelle ; B : réaction de blocage.
- Le secteur bas n'a pas de frappe montante validée ; F et P indiquent également qu'aucun équivalent précis n'est encore adapté. Les commandes ne substituent pas de faux clips Mixamo.
- Les esquives conservent le déplacement horizontal capturé. Les autres gestes non cycliques conservent aussi leurs déplacements, tandis que les marches/courses et attentes restent sur place.

C'est un laboratoire d'animations, pas encore la simulation complète du combat. Distinction légère/lourde, feintes, parade précise, réactions synchronisées, endurance, dégâts et politique Ignition restent à intégrer. Les postures de bras du pack Longbow doivent encore être adaptées à la hache ; les mouvements sont bien issus de Mixamo, mais toutes les poses d'armure ne sont pas finalisées.

## Transfert

`retarget_mixamo.py` lit le projet existant `blood-angel-combat.blend` dans un nouveau processus et remplace les actions uniquement dans cette session. Il sauvegarde sous `blood-angel-mixamo.blend`. Les rotations sont transférées en espace personnage, avec une correction du roulis après alignement des directions des os de référence. Cela évite d'appliquer une deuxième flexion aux coudes déjà fléchis du modèle acheté. L'évaluation des os est ordonnée parent avant enfant.

La correction de hauteur place la botte la plus basse au sol après adaptation des proportions. C'est une correction verticale globale, pas un solveur IK : le glissement résiduel, les articulations d'armure et la tenue de l'arme restent à examiner visuellement. Les épaulières suivent partiellement le bras ; les plaques restent rigides.

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-combat.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/retarget_mixamo.py
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-mixamo.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/validate_mixamo.py
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-mixamo.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/export_blood_angel.py -- --mixamo
```

Après reconstruction, synchroniser `src/mixamo-catalog.ts` depuis le JSON privé `mixamo-catalog.json` (métadonnées seulement, aucun maillage ni texture). Les fichiers générés sont réécrits : enregistrer les retouches manuelles sous un autre nom.

Les GLB, FBX et archives restent dans `~/.local/share/ignition-assets/blood-angel/`. La route Vite de développement sert un nom fixe supplémentaire ; les ressources achetées ne sont pas copiées dans le build public.

## Preuves techniques

- 48 sources vérifiées par SHA-256 ; noms d'actions et nombres d'images concordants ; aucun saut retenu.
- 30 échantillons évalués sur garde, marche, attaque descendante, esquives avant/gauche et poing : botte la plus basse à moins de 0,002 unité du sol.
- Export : une scène, armature/skin, 48 clips ; 44 987 892 octets, 105 meshes (armure, arme et couvertures d'articulations).
- Ces vérifications établissent provenance, articulation et hauteur des pieds échantillonnés. Elles ne certifient pas toutes les intersections ou le rendu artistique de chaque frame.

Validation finale : typecheck et build passent ; full Vitest : 54 fichiers / 359 tests passés, 3 fichiers / 3 tests ignorés. Le build ne contient aucun GLB Blood Angel. Les 48 boutons ont été sélectionnés et mis en pause dans le navigateur, avec concordance titre/source ; garde droite puis raccourci 1 déclenche la frappe horizontale. Esquive gauche et frappe descendante examinées au curseur. Revue Standards/Spec : transition de redressement exclue des boucles, vitesse de marche synchronisée avec les métadonnées source ; aucun finding restant sur les points revérifiés. Capture privée `mixamo-cage.png`. Pas de benchmark de performance ni de validation exhaustive des collisions d'armure.
