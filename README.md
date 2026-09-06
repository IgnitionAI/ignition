# IgnitionAI

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-184%20passing-22c55e?style=flat-square)](https://github.com/IgnitionAI/ignition/actions)
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
- **Production-ready.** TypeScript strict mode, Zod validation, 184+ tests, CI/CD, modular monorepo.

---

## Install

One package. Everything included.

```bash
npm install ignitionai
# or
pnpm add ignitionai
```

---

## Quick Start (7 lines)

```ts
import { IgnitionEnvTFJS, CartPoleEnv } from 'ignitionai';

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
import { IgnitionEnvTFJS, TrainingEnv } from 'ignitionai';

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

## Train in the Browser, Deploy Everywhere

The ONNX bridge is what makes IgnitionAI a serious tool, not a toy:

```ts
import { saveForOnnxExport } from 'ignitionai';

// 1. Train in the browser
env.train('dqn');
// ... wait for convergence ...
env.stop();

// 2. Export to ONNX
const { conversionScript } = await saveForOnnxExport(
  env.agent.model,
  './export',
);

// 3. Run the Python conversion script (one-time)
// bash convert.sh

// 4. Deploy the .onnx model anywhere:
//    - Unity via Sentis or Barracuda
//    - Unreal Engine via NNE
//    - Python / C++ / Rust via ONNX Runtime
//    - Mobile / edge devices
```

You can also run inference directly in JS using the trained model:

```ts
import { OnnxAgent } from 'ignitionai';

const agent = new OnnxAgent({
  modelPath: './my-model.onnx',
  actionSize: 4,
});
await agent.load();
const action = await agent.getAction(observation);
```

---

## Use with React Three Fiber

Pair IgnitionAI with your R3F scene — the env describes the logic, your meshes render the state.

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { IgnitionEnvTFJS, TrainingEnv } from 'ignitionai';
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
import { HuggingFaceProvider } from 'ignitionai';

const storage = new HuggingFaceProvider({
  token: process.env.HF_TOKEN,
  repoId: 'your-username/your-rl-model',
});

await storage.save('my-agent-v1', env.agent.model);
const model = await storage.load('my-agent-v1');
```

---

## Demos

Five interactive demos showing the framework in action. Each one is a full package you can run locally.

### 2D Demos — Canvas + Charts

| Demo | What it shows | Algorithm |
|---|---|---|
| **GridWorld** | Agent finds the shortest path in a 7×7 grid | Q-Table, DQN, PPO |
| **CartPole** | Classic pole-balancing benchmark with Euler physics | DQN, PPO |
| **MountainCar** | Agent discovers momentum strategy to climb a hill | DQN, PPO |

### 3D Demos — React Three Fiber

| Demo | What it shows | Tech |
|---|---|---|
| **CartPole 3D** | Metallic cart and pole, sunset environment, contact shadows | R3F + drei |
| **Car Circuit** | 3D car learns to drive an oval circuit — chase cam, HUD, minimap, fading trail, 1x–50x speed slider | R3F + drei |

### Run them locally

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
pnpm install
pnpm -r run build

# Pick your demo:
pnpm --filter demo-gridworld dev       # http://localhost:3001
pnpm --filter demo-cartpole dev        # http://localhost:3002
pnpm --filter demo-mountaincar dev     # http://localhost:3003
pnpm --filter demo-cartpole-3d dev     # http://localhost:3010
pnpm --filter demo-car-circuit dev     # http://localhost:3020
```

Each demo has: live 3D/2D visualization, Train/Inference/Stop/Reset controls, algorithm picker (DQN/PPO), live reward chart, and a code panel showing the exact API you'd write in your own project.

---

## Packages

IgnitionAI is a pnpm monorepo. The `ignitionai` package is an umbrella that re-exports everything — most users only need that one.

```
ignitionai                  ← single install, everything included
├── @ignitionai/core           IgnitionEnv, TrainingEnv interface, types
├── @ignitionai/backend-tfjs   DQN, PPO, Q-Table + IgnitionEnvTFJS
├── @ignitionai/backend-onnx   OnnxAgent, TF.js → ONNX exporter
├── @ignitionai/storage        HuggingFace Hub model persistence
└── @ignitionai/environments   GridWorld, CartPole, MountainCar
```

You can also install individual packages if you want fine-grained dependency control.

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

**v0.1 — first public release.**

- Core framework: stable
- Algorithms (DQN, PPO, Q-Table): stable with convergence tests
- ONNX export: functional (requires Python conversion step)
- HuggingFace storage: stable
- 184+ tests passing across all packages
- CI/CD: GitHub Actions running tests + build on every PR

See [roadmap.md](./roadmap.md) for what's coming next (SAC, multi-agent, model hub, more demos).

---

## Contributing

Contributions are very welcome. If you build creative JS experiences and want better RL tooling, this project is for you.

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
pnpm install
pnpm -r run build     # build all packages
pnpm -r run test      # run all tests
```

The codebase follows:

- **Spec-driven development** — every feature has a spec in `specs/` (see `specs/012-demo-car-circuit/` for an example)
- **TDD** — write the failing test, make it pass, refactor
- **TypeScript strict mode** — no `any`, proper types everywhere
- **Constitution** — see `.specify/memory/constitution.md`

---

## License

[MIT](./LICENSE) — use it for anything, commercial or otherwise. Attribution appreciated but not required.

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
