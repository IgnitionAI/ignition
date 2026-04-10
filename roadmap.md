# IgnitionAI — Roadmap

## Phase 1 — Core Algorithms [DONE]

> Train RL agents in the browser with zero Python dependencies.

- [x] Q-Table — tabular Q-Learning with mixed-radix state discretization
- [x] DQN — Deep Q-Network with replay buffer, target network, epsilon-greedy
- [x] PPO — Proximal Policy Optimization with Actor-Critic, GAE-lambda, clipped surrogate, entropy bonus
- [x] All agents implement `AgentInterface` (getAction, remember, train, dispose, reset)
- [x] Zod schema validation for all agent configs
- [x] Convergence tests (DQN navigation 1D, PPO navigation 1D, Q-Table GridWorld 5x5)

## Phase 2 — Core Infrastructure [DONE]

> Modular monorepo, configurable backends, environment loop.

- [x] pnpm workspace monorepo (core, backend-tfjs, backend-onnx, storage)
- [x] `IgnitionEnv` — environment loop with `step()`, `start()`, `stop()`, `reset()`
- [x] Gymnasium-style API: `terminated` / `truncated` (not `done`)
- [x] Configurable TF.js backend selector (WebGPU > WebGL > WASM > CPU)
- [x] Ring buffer replay memory (O(1) insert)
- [x] Callbacks system (onStep, onEpisodeEnd)
- [x] Zod validation for IgnitionEnvConfig

## Phase 3 — Model Persistence [DONE]

> Save, load, and share trained models.

- [x] `@ignitionai/storage` package
- [x] `ModelStorageProvider` interface (save/load/list/delete/exists)
- [x] Hugging Face Hub provider with retry and Zod config validation
- [x] DQN checkpoint system (regular + best model)
- [x] 19 tests passing

## Phase 4 — ONNX Export & Inference [DONE]

> Train in JS, deploy anywhere.

- [x] `@ignitionai/backend-onnx` package
- [x] `OnnxAgent` — inference-only agent implementing AgentInterface
- [x] ONNX Runtime wrapper (createOnnxSession, runInference)
- [x] TF.js to ONNX exporter (saveForOnnxExport + Python conversion script)
- [x] HF Hub loader for `.onnx` files with retry
- [x] Cross-runtime: deploy trained models in Unity (Sentis/Barracuda), Unreal (NNE), Python, C++, Rust

## Phase 5 — Visualization & Developer Experience [DONE]

> Watch agents learn in real time.

- [x] React Three Fiber demo (target chasing)
- [x] 3D visualization with Rapier physics
- [x] Real-time charts (reward, loss, epsilon) via Recharts
- [x] UI panel for hyperparameter configuration
- [x] Visual network designer (React Flow) — visual representation
- [ ] Fully integrate Network Designer to drive agent creation
- [ ] Web-based training dashboard (start/stop/compare runs)

## Phase 6 — Reference Environments [IN PROGRESS]

> Standardized environments for benchmarking and learning.

- [x] GridWorld NxN (in tests, needs standalone package)
- [x] CartPole (in tests, needs standalone package)
- [x] MountainCar (in tests, needs standalone package)
- [ ] Extract to `@ignitionai/environments` package with proper API
- [ ] Navigation 2D/3D environments for R3F
- [ ] Multi-agent environments
- [ ] Environment gallery / playground

## Phase 7 — Advanced Algorithms [PLANNED]

> Continuous action spaces and more.

- [ ] DDPG — Deep Deterministic Policy Gradient (continuous actions)
- [ ] SAC — Soft Actor-Critic
- [ ] A2C — Advantage Actor-Critic
- [ ] Curriculum learning utilities
- [ ] Self-play support
- [ ] Algorithm comparison / benchmarking tools

## Phase 8 — Production & Ecosystem [PLANNED]

> Make it easy to adopt and contribute.

- [ ] npm publish for all packages
- [ ] Comprehensive docs site
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Example gallery (Three.js, R3F, vanilla JS)
- [ ] ONNX deployment guides (Unity, Unreal, mobile)
- [ ] Performance profiling tools
- [ ] Community templates and starter kits

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
