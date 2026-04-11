# IgnitionAI — Roadmap

## Done

Everything below is shipped, tested, and on `dev`.

- **Core**: TrainingEnv/InferenceEnv interfaces, auto-config (`env.train('dqn')`), IgnitionEnv with train/infer/stop
- **Algos**: DQN, PPO, Q-Table — all with greedy mode for inference
- **Infrastructure**: pnpm monorepo, Zod validation, ring buffer, backend selector
- **ONNX**: OnnxAgent, TF.js→ONNX exporter, HF Hub loader
- **Storage**: HuggingFace Hub provider (save/load/list/delete)
- **Demos**: GridWorld, CartPole, MountainCar — train + inference mode, live reward chart
- **Tests**: 149 passing across all packages

---

## Phase 1 — Ship It (npm publish + CI/CD)

> Nobody can use IgnitionAI if they can't install it.

- [ ] CI/CD: GitHub Actions — tests + build on every PR, block merge on failure
- [ ] npm publish: `@ignitionai/core`, `@ignitionai/backend-tfjs`, `@ignitionai/backend-onnx`, `@ignitionai/storage`
- [ ] Extract environments into `@ignitionai/environments` package (GridWorld, CartPole, MountainCar with TrainingEnv interface)
- [ ] Publish environments to npm
- [ ] Version 0.1.0 — first public release
- [ ] CHANGELOG.md

## Phase 2 — The Wow Demo (3D + Physics)

> One killer R3F demo that makes people share it.

- [ ] CartPole 3D: React Three Fiber + Rapier physics — cart on rail, pole balancing, camera follows
- [ ] Train in browser → switch to inference → pole stays perfectly balanced in 3D
- [ ] Deploy as a standalone page on Vercel/Netlify — shareable URL
- [ ] This becomes the homepage hero demo

## Phase 3 — Landing Page & Docs

> Convert visitors into users.

- [ ] Landing page: hero demo (3D CartPole), "10 lines of code" pitch, install command, 3 demo links
- [ ] Documentation site: Getting Started, TrainingEnv API reference, algorithm guide, ONNX export guide
- [ ] README updated with badges, install command, quickstart pointing to docs
- [ ] SEO: "reinforcement learning javascript", "ml-agents alternative", "train AI browser"

## Phase 4 — Advanced Algorithms

> Continuous action spaces unlock real game AI use cases.

- [ ] Discussion: DDPG vs SAC vs TD3 — which first? (SAC recommended: more stable, entropy-regularized)
- [ ] SAC: Soft Actor-Critic for continuous action spaces (e.g. steering angle, throttle)
- [ ] Navigation 2D demo: continuous actions, obstacle avoidance — proves SAC works
- [ ] A2C: lightweight alternative to PPO for simpler problems

## Phase 5 — Ecosystem & Growth

> Make it easy to adopt, contribute, and build on.

- [ ] Example gallery: 5+ examples (Three.js, R3F, vanilla canvas, Node.js headless)
- [ ] ONNX deployment guide: step-by-step for Unity (Sentis), Unreal (NNE), Python
- [ ] Community templates: `create-ignitionai-app` starter
- [ ] Blog post / Twitter thread announcing the project
- [ ] Performance benchmarks: training speed on different backends (WebGPU vs WebGL vs CPU)

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
