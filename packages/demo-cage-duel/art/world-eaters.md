# Variante World Eaters — référence utilisateur blanc/bleu

Préparation séparée depuis le fichier privé `blood-angel-mixamo.blend` : `prepare_world_eater.py`, puis `export_blood_angel.py -- --world-eater`, avec Blender5.2.1 en processus isolé. Originals conservés.

-42 composantes déconnectées du plastron retirées (7732 sommets) : larme centrale, entourage et ailes. Le plastron porteur reste intact.
-Halo, bouclier héraldique et boucle ornementale retirés.
-Tous les objets Chainaxe et anneaux de poignée retirés de la variante. Aucun choix hache dans le duel ou la salle d’armes.
-74 objets maillés dans le GLB privé,48 animations préservées, squelette conservé.

Palette appliquée par `src/world-eater.ts` à la lecture Three.js : peinture rouge remplacée par ivoire, bleu sombre sur les épaulières ; masque de couleur avec variation issue de la texture pour préserver la patine. Maps de rugosité, métal et normales conservées sur le corps. Exception : les épaulières utilisent un matériau bleu sans aucune map du vendeur, avec grain procédural discret, afin de supprimer le symbole de toutes les couches. La palette est un matériau de jeu, pas une retouche destructive des textures du vendeur. Le modèle reste une adaptation de la base achetée, pas une reproduction complète de chaque détail de la référence.

Le GLB dérivé reste privé : `~/.local/share/ignition-assets/blood-angel/world-eater-mixamo.glb`, servi seulement en développement via une route fixe. Aucune copie du personnage dans dist/public. Crédits du vendeur conservés avec mention de l’adaptation.

Vérification : inspection de la géométrie exportée (aucune hache/halo/bouclier/boucle),48 clips ; capture réelle du duel `~/.local/share/ignition-assets/blood-angel/world-eaters-cage.png`. Typecheck/build et23 tests du package passent. Avertissement existant de taille du chunk Three.js conservé.

Lentilles : le masque émissif vert du casque est converti en émission rouge et la couleur de surface des lentilles est teintée rouge. Aucune modification des fichiers textures sources.
