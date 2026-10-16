# Validation intermédiaire — non retenue pour livraison

SHA source : `162f18b6b5a3576ba6505f5a3db37de4349cb21a`.

- `pnpm test` : code 0, 458 tests réussis et 3 ignorés ; build web compris.
- `pnpm run typecheck` : code 2, le nouveau test utilisait directement un itérateur `matchAll` avec une cible TypeScript web antérieure à ES2015 (`TS2802`).
- Corrigé dans `67b37dfe945b2af9554c9c7e83d227f35b0d4ceb` en matérialisant l’itérateur avec `Array.from`, sans modifier le compilateur ni la logique du blog.
- Voir `evidence/67b37dfe945b2af9554c9c7e83d227f35b0d4ceb/` pour la validation finale et les captures navigateur. Cette exécution intermédiaire ne constitue pas une validation complète.

Les logs conservent les sorties et codes retour ; codes ANSI et espaces finaux retirés pour la revue.
