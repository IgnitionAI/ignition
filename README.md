# IgnitionAI

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./package.json)
[![CI](https://github.com/IgnitionAI/ignition/actions/workflows/ci.yml/badge.svg)](https://github.com/IgnitionAI/ignition/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)](https://www.typescriptlang.org/)

> **The ML-Agents of the JavaScript creative ecosystem.**
> Train reinforcement learning agents directly in the browser. Deploy anywhere via ONNX.

IgnitionAI is an open-source RL framework built for creative developers working with **Three.js**, **React Three Fiber**, and the broader JS/TS stack. Describe your world in a class, call `env.train('dqn')`, and watch your agent learn in real time — no Python, no server, no GPU cluster.

---

## Why IgnitionAI?

Unity has [ML-Agents](https://github.com/Unity-Technologies/ml-agents). Python has Stable Baselines, RLlib, CleanRL. JavaScript had nothing comparable — until now.

- **Zero config.** Implement 5 methods, call `train()`. The framework figures out the neural network, hyperparameters, and training loop.
- **Browser-native.** TensorFlow.js with WebGPU > WebGL > WASM > CPU auto-selection. No install, no CUDA, no server.
- **Train → Deploy pipeline.** Train in JS, export to ONNX, deploy in Unity (Sentis), Unreal (NNE), Python, C++, or edge devices.
- **Three.js / R3F first.** Built for the JS creative stack. Pair it with your 3D scene and watch your agent learn in 3D.
- **Validated core.** TypeScript strict mode, Zod validation, behavioral and convergence tests, and a modular monorepo. See the status section for current validation limits.

---

## Install

The examples below use the **current repository source**. The published modular
packages are still version 0.1.0; the published TFJS entry point exports
`DQNAgent`, not the current `IgnitionEnvTFJS`/PPO/Q-table API. Use the workspace
for these examples until a new release is published:

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @ignitionai/backend-tfjs... --filter @ignitionai/environments... build
pnpm --filter demo-cartpole dev
```

`@ignitionai/core`, `@ignitionai/backend-tfjs`, `@ignitionai/backend-onnx`,
`@ignitionai/storage` and `@ignitionai/environments` exist on npm at 0.1.0.
The `ignitionai` umbrella is not published. Registry and published TFJS declaration
checks were performed on 2026-10-04. Package availability does not establish
parity with the source APIs documented here.

---

## Quick Start (7 lines)

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';

const cartpole = new CartPoleEnv();
const env = new IgnitionEnvTFJS(cartpole);

env.train('dqn');      // Zero config. It just works.
// env.infer();        // Switch to inference after training.
// env.setSpeed(50);   // Turbo training (50x faster).
```

That's it. The agent starts learning. The pole stays up.

---

## Define Your Own Environment

Describe your game world by implementing the `TrainingEnv` interface — 5 methods and an `actions` property.

```ts
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import type { TrainingEnv } from '@ignitionai/core';

class MyGame implements TrainingEnv {
  // What the agent can do
  actions = ['left', 'right', 'jump', 'shoot'];

  // What the agent sees (normalized to [-1, 1] ideally)
  observe(): number[] {
    return [
      player.x / WORLD_WIDTH,
      player.y / WORLD_HEIGHT,
      enemy.x / WORLD_WIDTH,
      enemy.y / WORLD_HEIGHT,
    ];
  }

  // What happens when the agent acts
  step(action: number): void {
    player.do(this.actions[action]);
  }

  // Is that good or bad?
  reward(): number {
    if (player.hitEnemy) return -10;
    if (player.collectedCoin) return +5;
    return -distance(player, nearestCoin) * 0.01;
  }

  // Is the episode over?
  done(): boolean {
    return !player.alive || player.won;
  }

  // Reset the world for a new episode
  reset(): void {
    game.restart();
  }
}

const env = new IgnitionEnvTFJS(new MyGame());
env.train();  // DQN with sensible defaults
```

The framework **deduces** `inputSize` from your first `observe()` call and `actionSize` from `actions.length`. You never touch neural network code.

---

## Algorithms

Switch algorithms with one word:

```ts
env.train('dqn');      // Deep Q-Network — discrete actions, replay buffer
env.train('ppo');      // Proximal Policy Optimization — on-policy, stable
env.train('qtable');   // Tabular Q-Learning — small discrete state spaces
```

| Algorithm | Type | Best for |
|---|---|---|
| **DQN** | Value-based, off-policy | Most discrete-action problems. Good default. |
| **PPO** | Policy gradient, on-policy | Complex policies, stability-critical training. |
| **Q-Table** | Tabular | Small, fully-observable grid worlds. |

You can override hyperparameters if you want fine control:

```ts
env.train('dqn', { lr: 0.0005, hiddenLayers: [128, 128, 64] });
```

---

Overrides apply when creating an agent. Calling `train()` without overrides
resumes the existing agent; passing overrides for the same existing agent throws
instead of silently changing or losing its weights. Create a new runner to start
with a new configuration. Switching algorithms creates a new agent.

Q-table observations default to bounds `[0, 1]` in every dimension. Supply
`stateLow` and `stateHigh` for other ranges. Each array must match the observation
size, with finite values and `stateHigh > stateLow`. Out-of-range observations
are clamped. Loading requires the same dimensions, bins and bounds as the
current agent; incompatible or malformed checkpoints leave it unchanged.

Automatic training and inference share one serialized transition stream.
`stop()` cancels future ticks; a transition already started may finish. Changing
mode or algorithm waits behind that transition before executing the new mode.
Manual `step()` and `inferStep()` calls are also serialized. Automatic failures
stop the loop and appear in `env.lastError`; starting a new loop clears it.

## Train in the Browser, Deploy Everywhere

Training runs in the browser. ONNX conversion is a separate Node/Python step.

```ts
// Browser: call after convergence, and do not resume while saving.
import { DQNAgent } from '@ignitionai/backend-tfjs';

env.stop();
await env.inferStep(); // Finish behind any training transition already in flight.
if (!(env.agent instanceof DQNAgent)) throw new Error('Expected DQN');
await env.agent.getModel().save('downloads://ignition-dqn');
```

Keep both downloaded files (`ignition-dqn.json` and `ignition-dqn.weights.bin`)
together. In Node, register `@tensorflow/tfjs-node` to enable `file://` handlers:

```ts
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { writeFile } from 'node:fs/promises';
import { saveForOnnxExport } from '@ignitionai/backend-onnx';

const model = await tf.loadLayersModel('file:///absolute/path/ignition-dqn.json');
const { modelDir, conversionScript } = await saveForOnnxExport(model, './export');
await writeFile(`${modelDir}/convert.sh`, conversionScript);
model.dispose();
```

`saveForOnnxExport` writes **TF.js JSON and weights**, and returns the script text.
It does not write or execute `convert.sh`. Activate an isolated Python 3.11
virtual environment, install the [tested conversion dependencies](packages/backend-onnx/examples/requirements-onnx.txt),
and run `bash ./export/convert.sh`. The script converts TF.js Layers → TensorFlow SavedModel → ONNX, producing `./export.onnx` by default.

See the [complete export examples and commands](packages/backend-onnx/examples/README.md).
Stop training before export; the returned model belongs to the agent and must
not be disposed while that agent is in use.

You can also run inference directly in JS using the trained model:

```ts
import { createOnnxSession, OnnxAgent } from '@ignitionai/backend-onnx';

const session = await createOnnxSession('./my-model.onnx');
const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
await session.release();
const agent = new OnnxAgent({
  modelPath: './my-model.onnx',
  actionSize: 4,
  inputName,
  outputName,
});
await agent.load();
const action = await agent.getAction(observation);
```

---

## Use with React Three Fiber

Pair IgnitionAI with your R3F scene — the env describes the logic, your meshes render the state.

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import type { TrainingEnv } from '@ignitionai/core';
import { useRef, useEffect } from 'react';

class GameEnv implements TrainingEnv {
  actions = ['left', 'right', 'jump'];
  observe() { return [...]; }
  step(action) { ... }
  reward() { return ...; }
  done() { return ...; }
  reset() { ... }
}

function Game() {
  const envRef = useRef<IgnitionEnvTFJS>();

  useEffect(() => {
    envRef.current = new IgnitionEnvTFJS(new GameEnv());
    envRef.current.train('dqn');
    return () => envRef.current?.stop();
  }, []);

  return (
    <Canvas>
      <PlayerMesh />
      <EnemyMesh />
    </Canvas>
  );
}
```

The training loop runs independently of the render loop — the agent learns while your scene renders at 60fps.

---

## Save & Load Models (HuggingFace Hub)

```ts
import { DQNAgent } from '@ignitionai/backend-tfjs';
import { HuggingFaceProvider } from '@ignitionai/storage';

const storage = new HuggingFaceProvider({
  token: process.env.HF_TOKEN,
  repoId: 'your-username/your-rl-model',
});

if (!(env.agent instanceof DQNAgent)) throw new Error('Expected DQN');
await storage.save('my-agent-v1', env.agent.getModel());
const model = await storage.load('my-agent-v1');
```

---

## Demos

The [shared demo catalogue](packages/web/data/demos.json) supplies the homepage, documentation and static build with the same routes and metadata. See the documentation catalogue at `/docs/demos` when running the web app locally.

**Circuit Racing** features two licensed 3D vehicles, a shared arcade simulation, learned imitation drivers, local checkpoints and races. Its evaluation reports include failures. The keyboard player mode shares the same physics as its opponents.

```bash
pnpm install
pnpm --filter demo-car-circuit dev
# Other package names and available methods: packages/web/data/demos.json
```

The build currently excludes Target Chasing pending a separate compatibility check. The old oval Circuit tutorial remains a teaching example and uses an incompatible observation/action contract.

---

## Packages

IgnitionAI is a pnpm monorepo. The modular `@ignitionai/*` packages are published on npm at 0.1.0, but do not yet contain all current source APIs. The local `ignitionai` workspace re-exports them, but is not published on npm (registry checked 2026-10-04).

```
ignitionai                  ← local umbrella workspace, not published
├── @ignitionai/core           IgnitionEnv, TrainingEnv interface, types
├── @ignitionai/backend-tfjs   DQN, PPO, Q-Table + IgnitionEnvTFJS
├── @ignitionai/backend-onnx   OnnxAgent, TF.js → ONNX exporter
├── @ignitionai/storage        HuggingFace Hub model persistence
└── @ignitionai/environments   GridWorld, CartPole, MountainCar
```

Use individual workspace packages for fine-grained dependency control. Check the published declarations before using a source example against npm 0.1.0.

---

## Training Speed Control

IgnitionAI exposes `env.setSpeed(multiplier)` so you can accelerate training dynamically:

```ts
env.train('dqn');
env.setSpeed(50);    // Turbo — 50x faster, agent learns in seconds
// ... agent converges ...
env.setSpeed(1);     // Back to real-time for visual inspection
env.infer();
```

Under the hood: `stepIntervalMs` goes down and `stepsPerTick` batches multiple steps before yielding to the event loop. Visual updates may become choppy at high speeds but training integrity is preserved.

---

## Tips for Good Results

- **Normalize observations** to `[-1, 1]` or `[0, 1]`. Neural networks hate unbounded inputs.
- **Shape your rewards.** Dense rewards (distance-based) converge faster than sparse rewards (goal-only). Use sparse only when you want to test exploration.
- **Start simple.** Get DQN working on a small env before scaling up. CartPole is your "hello world".
- **Let it run.** RL is slower than supervised learning. Be patient or crank the speed slider.
- **Defaults are good defaults.** If training doesn't converge, first check your env logic — not the hyperparameters.

---

## Project Status

**v0.1 packages, with further development in this repository.**

- Core and algorithms have behavioral and convergence coverage; this does not promise convergence on every custom environment.
- Historical full suite on 2026-10-04 at source `52610b5`: **420 tests passed, 3 skipped** because `HF_TOKEN` was absent. This is not a test count for every later commit.
- Real local ONNX conversion and TFJS/ONNX output parity passed; see [the retained report](docs/verification/onnx/README.md).
- HuggingFace storage preserves real TFJS artifacts and authenticated loader requests in local transport tests; see [the provider proof](docs/verification/huggingface/README.md). The authenticated remote round-trip remains unverified without dedicated test credentials.
- Eight public demo entries are defined in the shared catalogue. Cage Duel is a local prototype; Target Chasing is excluded from public builds.
- Complete web build and local smoke checks passed; follow-up acceptance and CI are tracked in [PR #37](https://github.com/IgnitionAI/ignition/pull/37). A local check does not establish deployed behavior.
- Published modular npm packages are version 0.1.0; current source changes are not a newly published npm release.

SAC, multi-agent and the checkpoint catalogue have independently verified implementations in [PR #40](https://github.com/IgnitionAI/ignition/pull/40), [PR #39](https://github.com/IgnitionAI/ignition/pull/39) and [PR #42](https://github.com/IgnitionAI/ignition/pull/42). Their implementations are combined in this consolidation branch. Package tests/builds, complete web build and native gallery/SAC checks pass locally; these source PRs document the independent work. This does not establish a published release. See [roadmap.md](./roadmap.md) for delivery status and later work.

---

## Contributing

Contributions are very welcome. If you build creative JS experiences and want better RL tooling, this project is for you.

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
pnpm install
pnpm -r run build     # build all packages
pnpm exec vitest run --minWorkers=1 --maxWorkers=2  # run the root suite
```

The codebase follows:

- **Spec-driven development** — every feature has a spec in `specs/` (see `specs/012-demo-car-circuit/` for an example)
- **TDD** — write the failing test, make it pass, refactor
- **TypeScript strict mode** — no `any`, proper types everywhere
- **Constitution** — see `.specify/memory/constitution.md`

---

## License

The root [package metadata](./package.json) declares MIT. A root LICENSE text is currently missing; retain the separate licences and provenance supplied with demo assets.

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)

**Star the repo** ⭐ if you think creative JS devs deserve proper RL tooling.

## PPO rollout and episode boundaries

The public training loop collects **128 transitions** before an automatic PPO
update. Configure this with `env.train('ppo', { rolloutSize: 256 })`.
`batchSize` controls optimizer minibatches, independently of `rolloutSize`.
Calling `agent.train()` explicitly still updates all currently collected data,
including a partial rollout. A singleton or constant-advantage batch keeps its
raw advantages rather than removing its learning signal through normalization.

`TrainingEnv.done()` remains required for compatibility. Existing environments
continue to treat `done()` as a terminal condition. To distinguish external time
limits, optionally provide `truncated(): boolean`. In that case termination
falls back to `done() && !truncated()`. An optional `terminated(): boolean`
overrides that fallback; when both explicit flags are true, termination takes
precedence for value bootstrapping. Either flag resets the episode, retaining
its final observation in the returned transition.

PPO bootstraps nonterminal rollout ends and truncations from their actual next
observation; its advantage trace stops at either episode boundary. DQN and
Q-table also bootstrap truncations. Inference never trains. Manual environment
reset and inference steps discard incomplete PPO rollouts; stop/resume alone
retains them. Loading a PPO checkpoint discards pending transitions.

Custom agents can optionally implement `shouldTrain()` to control automatic
update cadence and `discardRollout()` to discard on-policy data when the training
trajectory is interrupted. Agents without these hooks retain per-step updates.

## Circuit evaluation (local demo API)

The Circuit demo exposes `evaluateCircuit(policy, { policyId, circuit })` from
its evaluation module. Pass a versioned policy identifier and `training` or
`test`. The evaluator requests greedy actions through `IgnitionEnv.inferStep()`
and never invokes the supplied policy's `train()` or `remember()`. Evaluate a
checkpoint that is not being trained concurrently.

Protocol `circuit-evaluation-v1` fixes two distinct oval geometries, three starting
waypoints, a 1,500-transition limit per episode and a three-lap success criterion.
It returns a JSON-serializable versioned report with per-episode outcomes,
transition counts, completed laps and simulated lap times (50 ms per step).
These are simulated times, not browser execution times. Preserve the report with
its checkpoint and avoid training or selecting models on the reserved test track.

The existing three-argument `CircuitEnv` constructor remains supported. Its
optional fourth argument configures `maxSteps`, `targetLaps` and `startWaypoint`.
Terminal failure/success and external time limits are distinct; `lastEpisode`
retains the final metrics after an automatic reset. Completed laps require net
forward progress from the selected starting position, rather than merely
crossing the start line.

This is the historical oval protocol. The current Circuit Racing experience uses
its own `circuit-racing-v1`, `racing-observation-v1` and `circuit-race-v1` contracts.
See [Circuit Racing](packages/demo-car-circuit/README.md) for current behavior,
learned checkpoint reports and validation boundaries.
