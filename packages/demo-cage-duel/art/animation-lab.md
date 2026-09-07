# État actuel : Mixamo

La salle d’armes charge maintenant 48 vrais clips Mixamo transférés au Blood Angel. Voir [mixamo-integration.md](mixamo-integration.md) pour les commandes, limites et preuves actuelles.

---

# Historique conservé — première passe maison (remplacée dans la salle d’armes)

# Salle d’armes — essai local des animations

Ouvrir `http://127.0.0.1:3033/animations.html` après `pnpm --filter demo-cage-duel dev`. Un lien est aussi présent dans l'atelier. Le fichier acheté et son export doivent être disponibles sur cette machine.

## Ce qui est livré

Blood Angel acheté, premier squelette FK, hache tronçonneuse créée dans Blender et 42 clips réellement exportés : 4 gardes, 4 déplacements, 8 frappes, 4 feintes, 8 blocages/parades, 4 esquives, 1 poing, 6 réactions dont la défaite et 3 enchaînements. Deux personnages sont visibles dans la cage ; la cible reste en garde.

Le catalogue déclenche chaque mouvement indépendamment. Pause, vitesse, boucle, curseur temporel et caméra orbitale permettent l'inspection. Le filtre réduit la liste par famille. Les déplacements du catalogue sont des cycles sur place ; le clavier déplace réellement le personnage avec orientation vers la cible et limites de distance/rayon. Relâcher les touches de déplacement avant d'essayer une attaque au clavier.

- ZQSD ou WASD : déplacement ; flèches : garde.
- 1 : légère ; 2 : lourde ; 3 : poing ; 4 : esquive selon le secteur choisi.
- F : feinte ; B : blocage ; P : parade ; Espace : pause/reprise.
- Sélection de texte/liste : les raccourcis sont suspendus pour préserver l'utilisation du contrôle. Les boutons du catalogue conservent les raccourcis.

Il s'agit d'un **mode d'animation**, pas encore du duel complet : pas de dégâts, endurance, fenêtres de parade/invulnérabilité, réactions synchronisées de l'adversaire ou politique Ignition dans cette page. Les enchaînements sont des démonstrations préassemblées, pas un système de combo interactif. Les règles validées dans `combat-needs-draft.md` restent à intégrer au jeu.

## Production et limites visuelles

Les mouvements sont une première passe de poses clés créée dans Blender, sans Mixamo ni motion capture. Les plaques restent rigides. Les contrôles IK, le contact précis des pieds, la compensation complète des épaulières et les raccords entre mouvements restent à améliorer. La hache est une première géométrie conçue pour éprouver la prise et les trajectoires. Le catalogue n'est pas une affirmation de qualité AAA.

Les fichiers Blender/GLB/PNG restent dans `~/.local/share/ignition-assets/blood-angel/`, hors Git et hors `public/`. La route Vite sert deux noms fixes uniquement en développement. Le build contient la page mais pas le modèle acheté ; elle nécessite donc ces ressources privées et ne constitue pas une publication autonome.

Depuis la racine du dépôt :

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-rigged.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/animate_blood_angel.py
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-combat.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/export_blood_angel.py -- --combat
/Applications/Blender.app/Contents/MacOS/Blender -b ~/.local/share/ignition-assets/blood-angel/blood-angel-combat.blend --python-exit-code 1 -P packages/demo-cage-duel/art/blender/validate_combat_motion.py
```

Le script d'animation travaille dans un nouveau processus et remplace les actions de sa session ; les sources et le rig d'entrée ne sont pas sauvegardés/modifiés. Les fichiers générés sont réécrits : enregistrer les modifications manuelles sous un autre nom avant de reconstruire. Le catalogue UI `src/combat-catalog.ts` reprend les métadonnées de `combat-catalog.json` ; le chargement échoue explicitement si un clip annoncé manque dans le GLB.

## Vérification du 2026-09-07

- Export : une scène, skin présent et ensemble exact des 42 noms d'animations ; cadence source 30 fps conservée.
- Translations du Root vérifiées dans Blender : esquives avant/arrière Y ±0,608, latérales X ±0,608, abaissement Z −0,09 ; défaite Z −0,48 sans déplacement Y. Ceci vérifie les axes, pas le contact artistique complet des pieds.
- Navigateur : 42 sélections et mises en pause contrôlées ; garde gauche suivie du raccourci 1 donne la légère gauche. Curseur inspecté sur lourde et défaite, modèle texturé et arme visibles dans la cage.
- Typecheck et build passent. Full Vitest : 54 fichiers / 359 tests passés, 3 fichiers / 3 tests ignorés. Avertissement build sur le chunk Three.js >500 kB ; avertissement de développement « Multiple instances of Three.js » observé pendant le rechargement à chaud, aucune erreur signalée dans les logs consultés.
- Revue Standards : axes Root et maintien de pause corrigés, aucun finding restant sur ces points. Revue Spec : synchronisation de garde et raccourcis après clic corrigés, aucun finding restant sur les points revérifiés.
- Capture locale : `animation-lab.png`. Les performances n'ont pas fait l'objet d'un benchmark ; deux modèles détaillés sont affichés et la fluidité dépend de la machine.
