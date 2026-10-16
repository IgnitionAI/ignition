# Changelog

## v0.2.0-dev — Landing, Docs, and Physics Demo (2026-04-15)

### Landing & site
- Public site live at [ignitionai.dev](https://ignitionai.dev)
- Single Next.js deployment serving the landing, the docs, and the demos
- Brand: animated flame GIF logo, indigo palette, 3 custom inline SVG feature diagrams (ONNX pipeline, algorithm cards, R3F integration)
- Flame favicon across every page (`app/icon.svg`) and every demo

### Documentation
- 20-page Nextra documentation site under `/docs`
- Introduction + Quickstart (7-line CartPole example, real package imports)
- Verbose algorithm pages for DQN, PPO, and Q-Table with source-cited defaults and failure-mode recipes
- One "How it works" page per backend package (`core`, `backend-tfjs`, `backend-onnx`, `storage`) with annotated source walkthroughs
- React Three Fiber page explaining the training-loop / render-loop split
- 7 step-by-step tutorials: GridWorld, CartPole observations, MountainCar reward shaping, CartPole 3D, Car Circuit, ONNX → Unity, Drone Navigation

### Demos
- 5 existing demos embedded as static routes under `/demos/<slug>/`: GridWorld, CartPole, MountainCar, CartPole 3D, Car Circuit
- `← IgnitionAI` back link in every demo header
- Prebuild pipeline that builds the library packages and each Vite demo with the right base path before the Next.js build

### Drone Navigation (new hero demo)
- `@ignitionai/demo-drone-navigation` — a quadcopter that learns to fly to moving target points
- Hand-rolled rigid-body physics: gravity, drag, torque from asymmetric thrust, semi-implicit Euler integration at 50 Hz
- 8-action discretization (hover / forward / back / left / right / yaw) so DQN can handle 6-DOF flight
- Reward shaping: distance + progress delta + anti-spin + capture bonus + crash penalty
- Tuned defaults: `hiddenLayers: [64, 64]`, `minEpsilon: 0.05`, `epsilonDecay: 0.998` — visible hovers around episode 200–400

### Car Circuit reward fix
- Replaced the `+1 per on-track step` reward with dense progress shaping (`progressDelta × 300` + alignment + centerline). The old reward treated "spinning in place" and "making laps" as equally valuable.

## v0.1.0 — First Public Release (2026-04-11)

### @ignitionai/core
- `TrainingEnv` interface — implement 5 methods + actions to define your environment
- `InferenceEnv` interface — minimal observe + step for production deployment
- `IgnitionEnv` — training loop with `train()`, `infer()`, `stop()`, `reset()`
- Auto-config: deduces inputSize/actionSize from your environment
- Algorithm switching: `env.train('dqn')`, `env.train('ppo')`, `env.train('qtable')`
- Greedy mode for inference: `getAction(obs, greedy=true)`

### @ignitionai/backend-tfjs
- DQN — Deep Q-Network with replay buffer, target network, epsilon-greedy
- PPO — Proximal Policy Optimization with Actor-Critic, GAE-lambda, entropy bonus
- Q-Table — Tabular Q-Learning with mixed-radix state discretization
- `IgnitionEnvTFJS` — IgnitionEnv with TF.js agent factories baked in
- Sensible defaults per algorithm — zero config required
- Configurable TF.js backend selector (WebGPU > WebGL > WASM > CPU)

### @ignitionai/backend-onnx
- `OnnxAgent` — inference-only agent for ONNX Runtime
- TF.js → ONNX exporter with Python conversion script
- HuggingFace Hub loader for .onnx models

### @ignitionai/storage
- `ModelStorageProvider` interface (save/load/list/delete/exists)
- HuggingFace Hub provider with retry and Zod config validation

### @ignitionai/environments
- `GridWorldEnv` — NxN grid pathfinding (discrete)
- `CartPoleEnv` — Pole balancing with Euler physics (continuous state)
- `MountainCarEnv` — Momentum-based hill climbing (sparse reward)
- All implement `TrainingEnv` — plug and play with `IgnitionEnv`
