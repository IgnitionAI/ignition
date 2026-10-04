# PPO public-loop learning verification

Verified on 2026-10-04, TensorFlow.js4.22.0 CPU. Algorithm correction59a71b1
is already present in source4a3db07. Historical parent9be2a38 is the before
baseline. Both measurements use the same installed dependency runtime.

The existing unchanged public-loop test was copied into a detached worktree at
that parent and run with its own source aliases. All three seeded reward-learning
cases failed on the intended `>0.8` assertion:0.565,0.495,0.5. The current PPO,
bootstrap, episode and lifecycle set passed35 cases; the DQN/Q-table sibling set
passed31. Some truncation cases occur in both runs; these counts are per run.
Exact names and failure reasons are retained in tests.json.

The independent executable uses the real public runner and no replacement
policy. Its predeclared protocol is included in before.json/current.json:
512 training transitions, seeds11/29/47 and200 sampled evaluation actions,
with an80% threshold. The before-evaluation samples intentionally consume the
seeded stream, so this executable has a different sample sequence from the
existing test. Its baseline rates are0.48/0.435/0.485 (FAIL), while the repaired
rates are0.995/0.99/0.98 (PASS). Both failures and successes are retained.

This is a one-observation, two-action terminal reward task. It proves the
public reward-learning regression was repaired; it does not establish CartPole
convergence or general PPO competence. Seeds control the JavaScript random
stream; cross-backend bitwise reproducibility is not claimed.

From a source checkout with dependencies installed, reproduce the current run:

```bash
mkdir -p .scratch
packages/backend-onnx/node_modules/.bin/esbuild packages/backend-tfjs/scripts/verify-ppo-learning.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=./packages/core/src/index.ts --alias:@ignitionai/storage=./packages/storage/src/index.ts --external:@tensorflow/tfjs-node --outfile=.scratch/verify-ppo-learning.cjs
node .scratch/verify-ppo-learning.cjs .scratch/ppo-learning.json "$(git rev-parse HEAD)"
pnpm exec vitest run packages/backend-tfjs/test/ppo-public.test.ts packages/backend-tfjs/test/ppo-bootstrap.test.ts packages/core/test/episode-end.test.ts --minWorkers=1 --maxWorkers=2
```

For the negative control, create a detached worktree at9be2a38, copy the current
ppo-public.test.ts into its backend test directory, and run only the
`PPO learns rewarded actions` cases with that worktree's Vitest config. Use the
same installed dependencies for both revisions. The executable can likewise
be copied into that worktree and bundled using its core/storage source aliases.
A failing exit status is expected; a build/import error is not valid evidence.

Review: specification and standards PASS. Script strict typecheck PASS.
Singleton/nonterminal bootstrap, stopped episode traces, actual successor
observations and legacy done/truncation contracts are covered by the retained
public behavior tests. Verification does not claim a new npm release or merge.
