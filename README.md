# IgnitionAI

[![NPM Version](https://img.shields.io/npm/v/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)
[![License](https://img.shields.io/npm/l/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)

**The ML-Agents of the JavaScript creative ecosystem.**

IgnitionAI is an open-source reinforcement learning framework built for creative developers working with Three.js, React Three Fiber, and the broader JS/TS ecosystem. Train RL agents directly in the browser, then export to ONNX and deploy anywhere — Unity, Unreal, native apps, or edge devices.

## Why IgnitionAI?

Unity has [ML-Agents](https://github.com/Unity-Technologies/ml-agents). JavaScript developers had nothing comparable — until now.

- **POC in minutes, not days.** Wire up an environment with a few functions, pick an algorithm, and start training.
- **Train in the browser.** TensorFlow.js backends (WebGPU, WebGL, WASM, CPU) — no Python, no server, no CUDA setup.
- **Export to ONNX.** Train in JS, export to `.onnx`, deploy in Unity, Unreal, or any ONNX-compatible runtime.
- **Visualize in 3D.** First-class React Three Fiber integration — watch your agent learn in real time.
- **Modular by design.** Use only what you need. Swap algorithms, backends, or storage providers independently.

## Packages

```
packages/
  core/             @ignitionai/core            Environment loop, types, Zod schemas
  backend-tfjs/     @ignitionai/backend-tfjs     DQN, PPO, Q-Table (training)
  backend-onnx/     @ignitionai/backend-onnx     ONNX inference agent, TF.js-to-ONNX exporter
  storage/          @ignitionai/storage          Model persistence (Hugging Face Hub)
  demo-target-chasing/                           3D demo with React Three Fiber
```

## Quick Start

```bash
pnpm install @ignitionai/core @ignitionai/backend-tfjs
```

### 1. Create an agent

```ts
import { DQNAgent } from '@ignitionai/backend-tfjs';

const agent = new DQNAgent({
  inputSize: 4,
  actionSize: 2,
  hiddenLayers: [64, 64],
  lr: 0.001,
  gamma: 0.99,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  minEpsilon: 0.01,
  batchSize: 32,
  memorySize: 10000,
});
```

### 2. Define your environment

```ts
import { IgnitionEnv } from '@ignitionai/core';

const env = new IgnitionEnv({
  agent,
  getObservation: () => [posX, posY, targetX, targetY],
  applyAction: (action) => { /* move your agent */ },
  computeReward: () => {
    const dist = distance(agent, target);
    return dist < 0.1 ? 10.0 : -dist;
  },
  isTerminated: () => reachedGoal || outOfBounds,
  onReset: () => { /* reset positions */ },
});
```

### 3. Train

```ts
// In a game loop, R3F useFrame, or requestAnimationFrame
await env.step();
```

### 4. Export to ONNX and deploy anywhere

```ts
import { saveForOnnxExport } from '@ignitionai/backend-onnx';

// Export TF.js model to SavedModel format + Python conversion script
const result = await saveForOnnxExport(agent.model, './export');
// Then run: python convert_to_onnx.py -> model.onnx
// Load in Unity, Unreal, or any ONNX runtime
```

## Algorithms

| Algorithm | Type | Package | Status |
|-----------|------|---------|--------|
| DQN | Value-based, off-policy | `backend-tfjs` | Stable |
| PPO | Policy gradient, on-policy | `backend-tfjs` | Stable |
| Q-Table | Tabular, off-policy | `backend-tfjs` | Stable |
| ONNX Inference | Inference-only | `backend-onnx` | Stable |

All agents implement the same `AgentInterface` — swap algorithms with zero code changes.

## Use with React Three Fiber

```tsx
import { useFrame } from '@react-three/fiber';

function TrainingScene() {
  const envRef = useRef(env);

  useFrame(async () => {
    const result = await envRef.current.step();
    // result.observation, result.reward, result.terminated
  });

  return (
    <>
      <AgentMesh position={agentPos} />
      <TargetMesh position={targetPos} />
    </>
  );
}
```

## The ONNX Bridge: Train in JS, Deploy Everywhere

This is IgnitionAI's killer feature. The workflow:

1. **Prototype** your environment in Three.js / R3F
2. **Train** with DQN, PPO, or Q-Table directly in the browser
3. **Export** to ONNX format
4. **Deploy** the trained model in:
   - Unity (via [Barracuda](https://docs.unity3d.com/Packages/com.unity.barracuda@latest) or [Sentis](https://unity.com/products/sentis))
   - Unreal Engine (via [NNE](https://dev.epicgames.com/documentation/en-us/unreal-engine/neural-network-engine-overview))
   - Python / C++ / Rust (via [ONNX Runtime](https://onnxruntime.ai/))
   - Mobile / Edge devices

No need to rewrite your RL logic. Train fast in JS, ship optimized inference everywhere.

## Model Persistence

Save and load models from Hugging Face Hub:

```ts
import { HuggingFaceProvider } from '@ignitionai/storage';

const storage = new HuggingFaceProvider({
  token: process.env.HF_TOKEN,
  repoId: 'your-username/your-model',
});

await storage.save('my-dqn-v1', agent.model);
const loaded = await storage.load('my-dqn-v1');
```

## Running the Demo

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
pnpm install
pnpm -r run build
cd packages/demo-target-chasing
pnpm dev
```

Open `http://localhost:5173` — a DQN agent learns to chase a target in a 3D scene with real-time reward/loss/epsilon charts.

## Tips

- **Normalize observations** to [0, 1] or [-1, 1] for faster convergence.
- **Shape your rewards.** Dense rewards (distance-based) beat sparse rewards (goal-only) every time.
- **Start simple.** Get a DQN working on a toy problem before scaling up.
- **Use the backend selector** to pick the fastest available backend for your device.

## Roadmap

See [roadmap.md](./roadmap.md) for the full development plan.

## Contributing

Contributions are welcome! This is an open-source project — if you build creative JS experiences and want better RL tooling, this is for you.

```bash
pnpm install          # install all deps
pnpm -r run build     # build all packages
pnpm -r run test      # run all tests
```

## License

MIT

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
