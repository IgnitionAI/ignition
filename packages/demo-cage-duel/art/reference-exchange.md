# Échange de référence — lourde, parade, riposte

Objectif utilisateur : un échange jouable dans la cage où animation, son, étincelles et réaction corporelle sont synchronisés et servent de référence pour la démo.

- Conserver les quatre attaques et la parade manuelle. Une garde maintenue bloque ; un appui précis pare.
- Après une parade, une légère lancée pendant l'ouverture devient une riposte identifiable ; dégâts inchangés, adversaire vulnérable pendant son déséquilibre.
- Exercice répétable : partenaire scripté lance une lourde à portée ; le joueur pare puis riposte. Présentation automatique explicitement nommée, utilisant les mêmes commandes et règles, pour inspection et capture.
- Lourde : préparation lisible, accélération de la lame, contact calé sur le clip réel. Parade : déviation et recul du bras ; riposte : réaction corporelle directionnelle.
- Son de moteur modulé, passage de lame, choc métallique distinct de l'impact sur armure ; commande muet. Aucun son avant interaction ; pause/focus/réinitialisation cohérents.
- Étincelles au contact, éclair bref, arrêt d'impact court et caméra modérée. Pas de dégâts ou d'effets de contact sur un coup hors portée.
- Vérifier les règles via Combat.step, déjà utilisé par la suite de tests du projet. Vérifier rendu, geste, lisibilité et commandes en navigateur, et produire une capture de l'échange. Tests seuls insuffisants pour clôturer l'objectif visuel/sonore.

Point de départ : f3c3a3f. Sources achetées conservées privées. Pas de publication.

## Implémentation et contrôles du 2026-09-07

- `Combat.step` émet le type de frappe et le statut riposte. Parade inchangée à 150 ms ; ouverture de riposte 550 ms et déséquilibre de l'attaquant 1.1 s pour qu'une légère lancée dans cette fenêtre atteigne la cible avant sa remise en garde, à portée constante.
- Corrections de contact des bras par IK au-dessus du mouvement Mixamo, calage de la lourde/légère à 38 % du clip au lieu de 46 %, correction de hauteur des appuis. Les clips privés source restent intacts. Ce ne sont pas des collisions géométriques généralisées : l'échange de référence est réglé à distance 2.
- Sons synthétisés localement par Web Audio : moteur, souffle de lame, acier et impact d'armure ; muet et capture de la piste mixée. Étincelles, lumière et arrêt d'impact proviennent du même événement de simulation. Capture canvas sans HUD, WebM VP9/Opus, 8 s au maximum ; pause/reset/focus finalisent une capture en cours.
- Navigateur : démonstration automatique vérifiée (parade puis impacts de 16 dégâts, joueur intact). Parade manuelle réussie dans l'interface et légère suivante constatée, avant l'élargissement final de la fenêtre. Captures privées `reference-parry.png` et `reference-riposte.png`.
- Première vidéo réelle `~/.local/share/ignition-assets/blood-angel/reference-exchange-first-capture.webm` : 1920×1080, ~8 s, VP9 et piste audio Opus non silencieuse. Images extraites inspectées. Elle précède les dernières corrections de hauteur des appuis et de cycle de vie ; ne constitue pas la preuve finale de ces corrections.
- 15 tests Combat passent ; TypeScript et build passent. Suite complète : 373 tests réussis, 1 timeout dans le test de course automobile `runs four reference drivers on one common clock to completion`, 3 ignorés. Le fichier de course repasse seul (14 tests, dont le test concerné en 2.3 s). Le quinzième test Combat a été ajouté ensuite et vérifie une riposte lancée 450 ms après parade contre une garde adverse maintenue.
- Revue Standards et Spec : dérive de caméra en pause, sons de l'ancien duel après reset, capture ignorant pause/reset corrigés ; relecture statique ciblée sans nouvelle observation. Rendu à l'arrêt désormais effectué uniquement sur invalidation, pour ne pas recalculer chaque frame des onglets en pause.

## Validation restant à faire avant de déclarer l'objectif atteint

Le navigateur s'est déconnecté pendant la dernière capture (`Browser is not available`, inventaire sans navigateur). Reprendre le contrôle de la page, recapturer la version courante, inspecter les contacts et les appuis dans le mouvement complet, confirmer une riposte manuelle reconnue avec la fenêtre finale, et vérifier pause/reset/muet/capture après les correctifs. La présence d'une piste audio et les niveaux mesurés ne suffisent pas à juger seuls la qualité perceptive du son. Ne pas présenter la première capture comme le rendu final.
