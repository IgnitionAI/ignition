# Épée tronçonneuse de Kaiser-E

Source fournie par l’utilisateur : `~/Downloads/wh-40k-chainsword.glb`, SHA-256 `221ada6ba0ece0292b9c0c5df88fa1db1d553161a1b22be5c80bd43ba5a19ca0`.
Métadonnées natives `asset.extras` : Wh-40k-chainsword, Kaiser-E, CC-BY-4.0, https://sketchfab.com/3d-models/wh-40k-chainsword-2976e3debf33494a831253b160f7d2c9 . La page Sketchfab renvoie403 au lecteur Web ; les informations de crédit proviennent du fichier téléchargé, pas d’une attribution devinée. Texte et conditions de la licence consultés sur https://creativecommons.org/licenses/by/4.0/ .

## Préparation

`art/blender/prepare_chainsword.py` a été exécuté via le MCP Blender5.2.1. Le GLB source est importé dans une scène séparée `Chainsword preparation`. Le script utilise le repos de Hand.R du rig `Blood Angel Rigged`, prépare une copie du maillage dans le repère local de cette main, réduit les textures à2K et exporte JPEG90. L’original4K est intact. Le `.blend` de l’épée et le rapport sont enregistrés dans `~/.local/share/ignition-assets/blood-angel/`.

Export actif/selection explicites et assertions AVANT copie vers public : un seul maillage, un seul nœud d’épée, aucune skin. Un premier export multi-scènes a été rejeté et retiré de public avant intégration. Le fichier distribué final ne contient aucun personnage acheté.

`public/models/chainsword.glb` :1,802,464 octets. Licence et modifications dans le GLB, fichier compagnon `chainsword-LICENSE.txt`, page `credits.html` et lien visible depuis combat/salle d’armes.

`src/weapon.ts` attache une copie à Hand.R ; la rotationX+90° annule la conversion globale glTF du prop pour respecter les axes locaux des os. Sélecteur épée/hache pour les deux personnages, dans les deux pages. Ancienne hache conservée et masquée réversiblement. Les clips et règles de combat restent ceux de la tranche Mixamo actuelle ; pas d’animation spécifique d’épée ni de déplacement des dents ajouté.

## Skills

Installation globale Codex via skill-installer, à partir de GitHub :
- `~/.codex/skills/blender` — LevyBytes/AI-SKILL-blender : références Blender, bpy, matériaux, transformations.
- `~/.codex/skills/blender-animation-rigging` — ra100/blender-claude-plugin : références animation, contraintes, armatures.

Instructions consultées pendant cette intégration. Ce sont des références communautaires : les opérateurs sont vérifiés contre Blender local, notamment `use_active_scene` de l’exporteur. Aucun serveur MCP remplacé. Disponibles à la découverte automatique au prochain tour.

Reproduction via MCP : `import runpy; runpy.run_path(chemin_absolu_du_script, run_name="__main__")`, après import de la source dans la scène nommée et chargement du rig. Le répertoire public cible est déduit du chemin du script, donc suit le checkout utilisé.

Validation finale : typecheck/build réussis ;370 tests réussis,3 ignorés. Inspection navigateur de la prise au repos et pendant une frappe, bascule épée/hache dans les deux pages. Capture privée `~/.local/share/ignition-assets/blood-angel/chainsword-combat.png`. La longueur de lame et la géométrie du gant restent à ajuster artistiquement ; les règles de portée du prototype sont inchangées.

Correction de prise après retour utilisateur : demi-tour autour du manche, avec le pivot de paume conservé. Le bord denté de la source est -Z ; il est désormais orienté vers -Y (avant du personnage au repos).
