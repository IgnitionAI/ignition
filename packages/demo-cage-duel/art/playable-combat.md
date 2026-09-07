# Duel jouable — première tranche

`combat.html` complète la salle d’armes, qui conserve ses 48 clips. Le moteur `Combat.step` est indépendant du `Duel` historique et de son contrat de politique sauvegardée.

## Périmètre de cette tranche

- Blood Angel acheté, cage Blender, véritables clips Mixamo privés, caméra verrouillée.
- Déplacements quatre directions sans saut ; trois directions de frappe/garde réellement disponibles (haut/gauche/droite).
- Vie, endurance, attaque légère/lourde, garde maintenue, parade sur nouvel appui de 150 ms, feinte de préparation lourde, esquive courte, poing court.
- Partenaire scripté clairement indiqué, cible passive et garde fixe haute. Aucune politique Ignition entraînée sur ce nouveau contrat.
- Les clips de frappe sont redistribués entre préparation/contact/récupération ; contact provisoire à 46 % du clip. Les collisions sont distance/direction, pas des collisions de la lame. Les lourdes reprennent les clips légers avec des timings différents : ce n’est PAS encore l’engagement corporel distinct demandé pour le résultat final.
- Garde visuelle commune, indication directionnelle fonctionnelle dans le HUD. Montante, quatre poses de garde, lourdes distinctes, animations de parade spécifiques et défaite restent à produire/adapter dans Blender. Fin du duel = arrêt sur pose et écran de résultat, pas une animation de mort.

## Réglages du prototype, à éprouver

Simulation fixe 60 Hz. Déplacement libre 1.8 unités/s, en garde 1.15 unités/s ; cadence des boucles Mixamo adaptée à ces vitesses. Légère : préparation .46 s, contact .12 s, récupération .44 s, 18 endurance, 16 dégâts. Lourde : .9/.2/.65 s, 32 endurance, 30 dégâts. Poing : .3/.1/.65 s, 20 endurance, 5 dégâts, portée 1.8 contre 2.5/2.65 pour la hache.

Blocage sans dégâts, coût 14/26 endurance ; parade directionnelle sur nouvel appui, stun attaquant .85 s. Changer la direction en maintenant B ne renouvelle pas la parade. Endurance nulle : actions offensives/esquive/feinte interdites, prochain blocage déséquilibre .9 s ; sortie à 25 endurance. Régénération 18/s en état prêt hors garde, délai .9 s après dépense.

Esquive .65 s, déplacement de 1.575 unité en espace libre pendant .3 s (5.25 unités/s), invulnérabilité .04–.27 s, coût 24. Feinte lourde uniquement en préparation, coût 10, récupération .22 s. Poing sur garde : récupération attaquant réduite à .12 s pour permettre une légère, ouverture .72 s, immunité à la nouvelle interruption par poing 2.5 s. Proposition non définitive : lourde/lourde et poing/lourde interrompent ; légère ne stoppe une lourde que hors phase active. Impacts simultanés évalués sur le même état, peuvent échanger leurs dégâts.

Maximum trois attaques rapprochées avant récupération prolongée .45 s et remise à zéro de chaîne. Aucune attaque pendant récupération/stun ; aucun buffer d’attaque. Recommencer réinitialise les deux combattants. Écran de départ avant tout échange. Les copies de clips du combat suppriment la translation horizontale du Root (la simulation possède le déplacement), sans modifier les originaux du catalogue. Pause et perte de focus arrêtent la simulation et vident les touches.

## Vérification

Tests publics de `Combat.step` : portée/contact unique, garde tenue vs parade fraîche, mauvaise direction, feinte, esquive, poing, épuisement et terminaison. Les tests du Duel historique restent inchangés. Validation visuelle et revue consignées après exécution.

Validation du 2026-09-07 : typecheck et build passent ; suite complète 55 fichiers/369 tests réussis, 3 fichiers/3 tests ignorés (dont 10 nouveaux tests de combat). Build conserve l’avertissement existant de chunk Three.js >500 ko ; aucun GLB Blood Angel publié dans dist.

Navigateur IAB, fenêtre 818×674 : échange léger constaté (adversaire100→84 PV), feinte constatée (vie intacte, endurance100→58), esquive et pause inspectées après correction du Root ; Espace active bien le bouton Reprendre au focus. Courts relevés du compteur de rendu :95–97 FPS, sans garantie de performance prolongée ou sur autre matériel. Capture privée `~/.local/share/ignition-assets/blood-angel/combat-playable.png`. Revue Standards et Spec : défaut de double translation et activation Espace corrigés, aucune observation restante lors de la revue ciblée.

Ajustement après essai utilisateur : déplacements libres +50 %, en garde environ +64 %, distance des esquives +50 %. Durées des attaques, récupération et fenêtre d’invulnérabilité conservées.

Variante World Eaters (retour utilisateur) : chargement privé de `world-eater-mixamo.glb`, peinture ivoire/épaulières bleues, suppression des emblèmes centraux et du halo. Épée seule dans le duel et la salle d’armes ; sélecteurs et géométrie des haches retirés de cette variante. Source Blood Angel originale conservée.
