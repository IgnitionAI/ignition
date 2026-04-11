# IgnitionAI — Roadmap

## Done

- **Core**: TrainingEnv/InferenceEnv interfaces, auto-config (`env.train('dqn')`), IgnitionEnv with train/infer/stop
- **Algos**: DQN, PPO, Q-Table — all with greedy mode for inference
- **Infrastructure**: pnpm monorepo, Zod validation, CI/CD (GitHub Actions), `ignitionai` umbrella package
- **ONNX**: OnnxAgent, TF.js→ONNX exporter, HF Hub loader
- **Storage**: HuggingFace Hub provider (save/load/list/delete)
- **Environments**: `@ignitionai/environments` — GridWorld, CartPole, MountainCar
- **Demos 2D**: GridWorld, CartPole, MountainCar — train + inference mode, live reward chart
- **Demo 3D**: CartPole 3D (R3F) — metallic cart, pole, rail, professional lighting
- **184+ tests** passing across all packages

---

## Phase 1 — Wow Demo: Car on Circuit (IN PROGRESS)

> A 3D car learns to drive on a circuit. The hero demo.

- [ ] Car on oval circuit with R3F + 3D model (.glb)
- [ ] Discrete actions: steer left, straight, steer right
- [ ] Observation: car position, angle, distance to track edges, velocity
- [ ] Agent learns to stay on track and complete laps
- [ ] Train → Inference toggle — car drives perfectly after training
- [ ] Deploy on Vercel as shareable URL

## Phase 2 — Landing Page & Docs

> Convert visitors into users.

- [ ] Landing page: hero demo embed, "10 lines of code" pitch, install command
- [ ] Documentation site: Getting Started, TrainingEnv API, algorithm guide, ONNX export
- [ ] README updated with badges, quickstart pointing to docs

## Phase 3 — Advanced Algorithms

> Continuous action spaces for real game AI.

- [ ] SAC (Soft Actor-Critic) — continuous steering angle, throttle
- [ ] Upgrade car demo to continuous actions with SAC
- [ ] A2C — lightweight alternative to PPO

## Phase 4 — Ecosystem & Growth

> Scale adoption.

- [ ] npm publish v0.1.0 (all packages + umbrella)
- [ ] Example gallery: Three.js, R3F, vanilla canvas, Node.js headless
- [ ] ONNX deployment guides: Unity (Sentis), Unreal (NNE)
- [ ] `create-ignitionai-app` starter template
- [ ] Blog post / Twitter launch

---

## Optional — Showcase Demos

> Additional 3D demos for the gallery. Build when time allows.

- [ ] **Drone hover** — 3D drone learns to stabilize mid-air (thrust 4 directions)
- [ ] **Marble on tilting platform** — tilt to guide a ball to the target
- [ ] **Rocket landing** — SpaceX-style inverted pendulum in 3D (thrust 4 directions)
- [ ] **Robot arm** — pick & place with joint rotations
- [ ] **Snake 3D** — classic snake game rendered in R3F

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
