# Combat lourd — besoins et plan d'animation

Demande du 2026-09-07. Les décisions explicitement validées sont distinguées des propositions de réalisation. Les valeurs d'équilibrage restent à tester dans le prototype.

## Besoins exprimés

- Duel au corps à corps, adversaire verrouillé, aucun saut.
- Déplacements avant, arrière, gauche et droite.
- Quatre attaques légères : latérale gauche, latérale droite, descendante, montante.
- Déclinaisons lourdes pour les quatre trajectoires.
- Esquive, blocage, parade et coup court au poing ou au pommeau.
- Squelette et animations du Blood Angel, adaptés à une armure lourde.

## Décisions validées pendant le cadrage

- Première arme : hache tronçonneuse à une main, avec l'autre poing libre pour ouvrir la garde.

- Enchaînements limités à trois attaques successives, mélangeant légères, lourdes et directions. Une fenêtre de défense existe entre les coups ; chaque attaque coûte de l'endurance. Après la troisième, retour en garde obligatoire. Durées et transitions exactes à régler en prototype.
- Une lourde résiste à l'interruption par une légère uniquement pendant sa frappe : les dégâts sont subis, le mouvement continue. Sa préparation reste interruptible ; une parade réussie l'arrête. Cette règle ne tranche pas encore les échanges lourde contre lourde ou le poing contre une lourde lancée.

- À endurance nulle, le combattant est épuisé : déplacements et garde restent possibles, attaques/feintes/esquives sont temporairement indisponibles. Un nouveau coup bloqué provoque un déséquilibre. La récupération permet de reprendre les actions ; seuil de sortie, délai et durée du déséquilibre restent à régler.

- Garde directionnelle manuelle, avec indicateur d'aide inspiré de For Honor ; parade au timing précis.
- Feinte autorisée pendant la préparation d'une attaque lourde, avec coût d'endurance. Une fois la frappe lancée, elle est engagée. Légères non annulables pour la première version.
- Esquive courte dans les quatre directions, sans saut ni roulade, avec brève invulnérabilité, coût d'endurance et récupération.
- Coup de poing destiné à ouvrir la garde : très courte portée, esquivable, ouvre une occasion d'attaque légère lorsqu'il touche un adversaire qui bloque ; sa récupération rend un échec punissable. Ne pas déduire de cette validation qu'il interrompt toutes les attaques ou garantit une chaîne infinie.

## Propositions et paramètres à préciser

Les directions des attaques désignent leur trajectoire, pas une commande de déplacement. « Arrière » semble désigner une frappe montante vers l'adversaire : interprétation à confirmer.

Locomotion verrouillée : avancer réduit la distance, reculer l'augmente, les déplacements latéraux tournent autour de la cible. Ajouter les transitions départ/arrêt, pivots et raccords diagonaux pour éviter le glissement des pieds.

Attaques : quatre trajectoires × deux intensités, avec préparation lisible, contact actif et récupération. Une lourde doit modifier engagement du corps, coût et ouverture après échec ; ralentir une légère ne suffit pas.

Commande de défense proposée : bonne direction et bouton maintenu pour bloquer ; nouvel appui précis pour parer, sans parade automatique par simple maintien. Indicateur à quatre secteurs, formes et couleurs pour différencier garde choisie et attaque entrante. Les fenêtres chiffrées, coûts et règles d'interruption non couvertes par les décisions ci-dessus restent ouverts.

Animations de réaction nécessaires : impact subi, impact bloqué, parade réussie, déséquilibre après parade, rupture de garde, défaite. Compléter le rig avec contrôles pieds/mains, prise d'arme et compensation des épaulières ; masquer les articulations ouvertes. Valider d'abord une locomotion, une attaque, un blocage et une parade dans le navigateur avant de multiplier les clips.

## Arme retenue

Hache tronçonneuse à une main et poing libre, confirmés par le joueur. Proposition de réalisation : arme à droite, poing à gauche, cohérente avec les premiers essais du rig. « Attaque marteau » décrit une trajectoire descendante, pas un marteau à produire. L'épée n'entre pas dans le premier catalogue d'animations.

## Catalogue d'animations à produire

Ce catalogue décrit des comportements visuels requis, pas nécessairement un fichier distinct pour chaque transition. Les raccords peuvent être interpolés si le résultat reste convaincant.

| Famille | Couverture attendue |
| --- | --- |
| Garde | Quatre orientations proposées, respiration discrète et passage d'une garde à l'autre |
| Locomotion | Quatre boucles avant/arrière/gauche/droite, départs, arrêts, pivots et raccords diagonaux |
| Attaque | Huit frappes : quatre trajectoires × légère/lourde ; préparation, contact actif, récupération et retour en garde |
| Enchaînement | Raccords permettant de mélanger les frappes, limite de trois portée par les règles du jeu |
| Feinte | Sortie de préparation des quatre lourdes vers la garde, sans contact actif |
| Esquive | Quatre pas courts, avec départ, évitement et récupération lisibles |
| Blocage | Réception du choc dans chaque direction, pieds et arme absorbant l'impact |
| Parade | Déviation directionnelle et réaction de l'attaquant dont la frappe est arrêtée |
| Poing | Coup court, retour après contact ou échec, réaction d'ouverture de garde |
| Réactions | Impact léger/lourd, déséquilibre, rupture de garde à épuisement, posture épuisée et défaite |

## Compléments du squelette

- Garder les plaques d'armure rigides ; ajouter une couverture crédible des articulations ouvertes.
- Ajouter des contrôles de mains et de pieds pour poser les appuis et tenir l'arme sans glissement.
- Prévoir une attache stable pour la hache, une vraie fermeture des doigts sur le manche et un poing gauche fermé.
- Compenser les épaulières et les plaques de hanche dans les amplitudes extrêmes ; vérifier cou, coudes, genoux et sac dorsal.
- Distinguer le rig de travail Blender du squelette exporté ; cuire les mouvements nécessaires à la lecture navigateur.

## Ordre de réalisation proposé

1. Hache, prise de main, corrections du rig et pose de garde convaincante.
2. Déplacements verrouillés et une frappe légère/lourde, avec blocage et parade, exécutés dans le navigateur.
3. Décliner les quatre trajectoires, ajouter feinte, poing, esquives et enchaînements.
4. Compléter réactions, épuisement, sons et effets ; tester les règles et ajuster les fenêtres.

Les animations doivent exposer leurs phases de préparation/contact/récupération. Le jeu décide des dégâts, de l'endurance, de l'invulnérabilité et des interruptions : les clips ne doivent pas créer de contacts ou de protection en dehors de ces règles. Une politique Ignition et le joueur devront respecter les mêmes actions et contraintes.

## Critères de validation proposés

- Appuis sans glissement évident, main sur le manche, absence de traversée majeure de l'armure, lecture des quatre trajectoires à la caméra de jeu.
- Une lourde visuellement distincte d'une légère par l'engagement du corps et la récupération.
- Feinte sans dégâts ; parade arrêtant effectivement la lourde ; résistance à une légère limitée à la phase validée.
- Défense possible entre deux coups ; quatrième attaque empêchée avant le retour requis ; pas de boucle poing/légère sans réponse.
- Esquive et épuisement cohérents entre animation et règles, sans saut ni roulade.
- Vérification des transitions et interruptions, pas seulement des clips isolés ; captures du navigateur et mesure des performances avant de déclarer le résultat jouable.

Les timings exacts, coûts, seuil de sortie d'épuisement, commandes clavier/manette et interactions lourde/lourde ou poing/lourde restent des paramètres à préciser. Les décisions non validées ne sont pas à présenter comme acquises.

## État vérifié

Le prototype possède trois directions d'attaque/garde et une parade liée à l'âge de la garde (`src/duel.ts`). Ce n'est pas encore le contrat à quatre trajectoires et deux intensités proposé ici. Le Blood Angel possède un premier rig FK privé ; ses poses sont diagnostiques. Aucun outil Mixamo n'est exposé à cette session lors de la vérification : ne pas présenter l'intégration MCP comme opérationnelle.
