# Persistence documentation reconciliation

Verified 2026-10-04 for issue #29 against current source.

Quickstart and storage docs now distinguish DQN/Double DQN/PPO network loading from an exact training continuation. Provider load returns a LayersModel; neural agents do not automatically restore saved agent metadata, replay/rollout history or optimizer progress. QTable separately stores its JSON table and epsilon directly in localStorage and validates the discretization contract. The examples initialize a compatible agent before loading, configure DownloadProvider explicitly, and avoid invented reward/convergence claims. Provider save returns a URI string. The S3 extension scaffold is explicitly unimplemented and throws rather than showing silent success.

Evidence owners: packages/core/src/ignition-env.ts; packages/backend-tfjs/src/agents/{dqn,ppo,qtable}.ts; packages/storage/src/providers/{indexeddb,localstorage,download}.ts. Existing Double DQN serialized load/inference proof is retained separately under docs/verification/double-dqn.

Validation: extracted four persistence examples and S3 scaffold, then checked them with strict TypeScript against source package aliases (ES2022, ESNext, bundler resolution, Node ambient types). Passed. Web ESLint passed. No new tests, providers or algorithms were introduced.

Browser CLI verified current Next development rendering on port 3104, both /docs/quickstart and /docs/how-it-works/storage. Routes rendered, corrected text/configuration appeared and no page errors were observed during the two-page check. Final Quickstart wording was rechecked after removing guaranteed learning language. Screenshots were displayed inline and inspected. First cold compilation required 103 seconds; timed-out observation scripts were resumed against the same live server. This is development-render evidence, not a new production build or public deployment.

Review and verification PASS for this documentation lot. Issue #29 remains open for full repository status/legacy-issue reconciliation.
