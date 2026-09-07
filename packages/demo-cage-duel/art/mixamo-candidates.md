# Mixamo — candidats trouvés par le MCP

2026-09-07. Correction demandée par l'utilisateur : employer réellement le MCP Mixamo et des animations de son catalogue, plutôt que considérer le pack de poses maison comme la réponse finale.

## Connexion MCP vérifiée

Dépôt installé : https://github.com/V1xel/mixamo-mcp dans `~/.local/share/mixamo-mcp`. Serveur stdio enregistré globalement dans Codex sous `mixamo`. Un client MCP local a exécuté `list_tools`, `status`, `list_animations` et `select_animation` : il ne s'agit pas seulement d'une lecture du README.

Ajustements locaux : dépendance `mcp>=1.0,<2` (la version 2 ne fournit plus `mcp.server.fastmcp`), navigateur visible pour la connexion utilisateur. Profil propre au MCP, sans import de cookies d'autres navigateurs.

## Sélection préliminaire

Ces noms/IDs sont retournés par `list_animations`. Présence au catalogue seulement : téléchargement, qualité visuelle, rig et compatibilité avec le Blood Angel encore à vérifier.

| Besoin | Nom Mixamo | ID |
| --- | --- | --- |
| Avant | Standing Walk Forward | 128650932 |
| Arrière | Standing Walk Back | 128650931 |
| Gauche | Standing Walk Left | 128650933 |
| Droite | Standing Walk Right | 128650934 |
| Descendante | Standing Melee Attack Downward | 128650912 |
| Horizontale | Standing Melee Attack Horizontal | 128650913 |
| Revers | Standing Melee Attack Backhand | 128650911 |
| Garde | Standing Block Idle | 128650903 |
| Blocage subi | Standing Block React Large | 128650904 |
| Esquive avant | Standing Dodge Forward | 127690916 |
| Esquive arrière | Standing Dodge Backward | 127690915 |
| Esquive gauche | Standing Dodge Left | 127690917 |
| Esquive droite | Standing Dodge Right | 127690918 |
| Poing | Standing Melee Punch | 127690921 |
| Enchaînement | Standing Melee Combo Attack Ver. 1 | 128650918 |

Requêtes réellement exécutées : walking, sword, axe, punch, dodge, sword and shield attack. `select_animation(128650912)` a confirmé la sélection dans les résultats. `status` indique encore `logged_in: False` : ne pas prétendre que le mouvement a été visualisé ou téléchargé. Les totaux de pagination renvoyés par le parseur sont parfois incohérents (0 total avec des résultats) ; les chiffres de taille du catalogue ne sont donc pas retenus comme preuve.

## Suite

Connexion Adobe dans la fenêtre Chrome for Testing dédiée au MCP. Récupérer un premier FBX avec squelette, inspecter armature et mouvement dans Blender, puis adapter au Blood Angel. Inspecter visuellement les candidats avant d'arrêter le catalogue ; les quatre trajectoires × deux intensités, la parade précise et les feintes ne sont pas encore couvertes par des clips validés. Garder l'ancienne salle d'armes comme essai conservé, sans la présenter comme une intégration Mixamo.

## Acquisition réelle via la session Chrome existante

Le 2026-09-07, l'onglet Chrome utilisateur a été vérifié connecté sous `salim`, personnage X Bot. Le MCP garde un profil distinct non authentifié : ses recherches ont fourni les candidats, mais le téléchargement a été demandé via l'interface de ce Chrome connecté. Ne pas prétendre avoir transféré sa session au MCP.

Le pack **Pro Melee Axe Pack**, exporté FBX Binary / T-pose / 30 fps / aucune réduction, a été préparé par Mixamo. Chrome a affiché ERR_BLOCKED_BY_CLIENT sur le lien S3 de l'archive ; le fichier a été récupéré par HTTPS depuis ce lien temporaire exact, sans extraction de cookies. Archive privée : `~/.local/share/ignition-assets/blood-angel/mixamo/Pro Melee Axe Pack.zip`, 5 875 030 octets, 48 entrées : X Bot et 47 animations. Extraction préservant l'archive dans `mixamo/axe-pack/`.

Vérification Blender effectuée :

- `X Bot.fbx` : une armature de **65 os**, deux meshes.
- `standing walk forward.fbx` : une armature de 65 os, action sur les images 1 à 41.
- `standing melee attack downward.fbx` : une armature de 65 os, action sur les images 1 à 69.

Rapport privé `mixamo/inspection.json`. Ces fichiers sont désormais acquis et importables. Le transfert des mouvements sur le Blood Angel, les corrections d'armure et le remplacement de la salle d'armes maison ne sont pas encore effectués. Les sauts présents dans le pack ne font pas partie du jeu demandé.


## Transfert effectué ensuite

Les paragraphes précédents décrivent l’acquisition. Le transfert a maintenant été réalisé : 48 clips (43 du pack hache et 5 du pack Longbow), sur le rig Blood Angel de 55 os. Voir [mixamo-integration.md](mixamo-integration.md) pour l’état courant et les limites. Les anciens rendus/animations maison sont conservés séparément.
