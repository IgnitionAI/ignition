# Evidence — issue #64 (code SHA 8876a4c)

- `raw/` : données brutes du protocole `robot-arm-v1-protocol-1`
  (pnpm --filter demo-robot-arm measure 8876a4c, backend tensorflow natif,
  tfjs 4.22.0, macOS arm64 10 cœurs, Node v26.10.0). Résultats déterministes
  (rejeu identique vérifié deux fois).
- `logs/measure-output.txt` : sortie console de la mesure (le fichier .log
  est ignoré par le .gitignore du monorepo).
- `browser/` : vérifications Chrome 155 headless (SwiftShader) contre le
  serveur de production Next (`pnpm --filter web build && pnpm start`) :
  - `e2e-final.*` : parcours complet `?e2e=1` au SHA 7410d3c (build final) —
    entraînement réel, inférence du même réseau, variation/ invariance des
    poids, FPS mesurés, zéro erreur console.
  - `demo-training-fr.*` / `demo-inference-fr.*` : captures d'article au
    bundle intermédiaire (code de simulation identique au SHA de mesure).
  - `demo-initial-fr.png` (arrêté, compteurs 0), `demo-mobile-390.png`
    (responsive), `demo-initial-en.png` (locale EN), `article-fr.png`,
    `landing-fr.png` (9 démos listées).

Code de simulation/mesure (robot-arm-env.ts, protocol.ts, controller.ts,
measure/) inchangé entre 8876a4c et HEAD — vérifié par `git diff --quiet`.
