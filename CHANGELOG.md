# Changelog

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
