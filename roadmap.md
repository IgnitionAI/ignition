# IgnitionAI — Roadmap

**Vision**: The ML-Agents of the JavaScript creative ecosystem. Train RL agents in the browser, deploy anywhere via ONNX.

**Positioning**: Outil technique (comme Three.js), pas produit SaaS. Open-source first. Monétisation via services complémentaires plus tard.

---

## Done

- **Core**: TrainingEnv/InferenceEnv interfaces, auto-config, IgnitionEnv with train/infer/stop/setSpeed
- **Algos**: DQN, PPO, Q-Table — with greedy mode for inference
- **Infrastructure**: pnpm monorepo, Zod validation, CI/CD, `ignitionai` umbrella package
- **ONNX**: OnnxAgent, TF.js→ONNX exporter, HF Hub loader
- **Storage**: HuggingFace Hub provider
- **Environments**: `@ignitionai/environments` — GridWorld, CartPole, MountainCar
- **Demos 2D**: GridWorld, CartPole, MountainCar
- **Demos 3D**: CartPole 3D, Car Circuit (dense progress reward), Drone Navigation (rigid-body physics hero demo)
- **184+ tests** passing

---

## Phase 1 — Public Launch Prep ✅

> Everything needed to post "Show HN" without getting roasted. **All done.**

### 1.1 Landing page ✅
- [x] Single-page site under `packages/web` (Next.js 16 + Tailwind 4)
- [x] Hero: install command + "Train your first agent" messaging
- [x] 7-line code snippet in Quickstart section
- [x] 6-demo grid (GridWorld, CartPole, MountainCar, CartPole 3D, Car Circuit, Drone Navigation)
- [x] IgnitionAI brand: flame GIF logo, indigo palette, custom SVG feature diagrams
- [x] Real package install command (`@ignitionai/core` + `@ignitionai/backend-tfjs` + `@ignitionai/environments`)
- [x] "Recent updates" section reading CHANGELOG.md at build time
- [x] Deployed on Vercel at `ignitionai.dev`

### 1.2 Documentation site ✅
- [x] Docs at `/docs` via Nextra 4, same Next.js deployment (single Vercel build)
- [x] Introduction + Quickstart (7-line CartPole, imports from `@ignitionai/environments`)
- [x] Verbose algorithm pages (DQN, PPO, Q-Table) with source-cited defaults and failure-mode recipes
- [x] "How it works" — one page per backend package with annotated source walkthroughs
- [x] React Three Fiber page: why R3F-first + full training-loop/render-loop split
- [x] 7 tutorials: GridWorld, CartPole observations, MountainCar reward shaping, CartPole 3D, Car Circuit, ONNX → Unity, Drone Navigation (physics + "IgnitionAI philosophy" section)
- [x] Auto-generated sidebar via `_meta.js` contracts, dark-mode matches landing
- [x] 26 routes built statically (landing, /changelog, /docs/*, 6 demo SPAs)

### 1.3 README + branding
- [x] README rewritten for v0.1 with current API + all demos
- [x] npm badges, license badge, test badge
- [x] Flame GIF logo (IgnitionAI brand asset)
- [x] Flame SVG favicon across all pages + demos (`app/icon.svg` + `public/favicon.svg`)
- [x] Root metadata: title template "— IgnitionAI", real description
- [ ] Social card image for Twitter/OG
- [ ] Hero GIF of Car Circuit or Drone demo in README

### 1.4 npm publish v0.1.0 ✅
- [x] All 5 packages published at 0.1.0: `@ignitionai/core`, `@ignitionai/backend-tfjs`, `@ignitionai/backend-onnx`, `@ignitionai/storage`, `@ignitionai/environments`
- [x] Docs updated post-publish: callouts removed, Quickstart uses `@ignitionai/environments`
- [x] Tag `v0.1.0` on GitHub

### 1.5 Live demos ✅
- [x] 6 demos embedded as static routes under `/demos/<slug>/` via prebuild pipeline
- [x] Each demo has `← IgnitionAI` back link
- [x] Vite configs accept `DEMO_BASE` env var for per-route asset paths
- [x] Next.js rewrites resolve `/demos/:slug/` to their `index.html`

### 1.6 Drone Navigation (hero demo) ✅
- [x] `packages/demo-drone-navigation` — quadcopter with hand-rolled rigid-body physics (gravity, drag, asymmetric thrust torque, semi-implicit Euler at 50 Hz)
- [x] 8 discrete actions (hover/forward/back/left/right/yaw), DQN-compatible
- [x] 13 normalized observations + dense reward (progress + anti-spin + capture bonus)
- [x] Tuned defaults: `hiddenLayers: [64, 64]`, `minEpsilon: 0.05`, `epsilonDecay: 0.998`
- [x] Chase camera, target sphere, grid ground, HUD
- [x] Drone tutorial in docs with "Honest convergence expectations" section + "IgnitionAI philosophy" manifesto

### 1.7 Changelog ✅
- [x] `/changelog` page rendered from `CHANGELOG.md` at build time (zero-dep Markdown parser)
- [x] Landing "Recent updates" section showing latest release highlights
- [x] `CHANGELOG.md` updated with `v0.2.0-dev` covering everything since v0.1.0
- [x] Footer link to /changelog

### 1.8 Car Circuit reward fix ✅
- [x] Replaced `+1 per on-track step` with dense progress shaping (`progressDelta × 300 + alignment + centerline`)

### Known framework bug (low priority)
- `backend-tfjs/src/defaults.ts:3-13` disagrees with `agents/dqn.ts:43` on `targetUpdateFrequency` (100 vs 1000). Docs cite the runtime value (1000). Cleanup commit needed.

---

## Phase 2 — Launch (next)

> Get the framework in front of the right people.

- [ ] **Blog post**: "How I built ML-Agents in JavaScript" (dev.to + personal blog)
- [ ] **Twitter thread**: video of Drone Navigation learning to fly + 7-line code + the philosophy quote
- [ ] **Show HN**: "IgnitionAI — Reinforcement Learning framework for JavaScript"
- [ ] **Reddit r/reinforcementlearning + r/javascript + r/threejs + r/reactjs**
- [ ] **Product Hunt** submission
- [ ] **Discord server**: community + support channel
- [ ] Social card image for Twitter/OG meta tags
- [ ] Hero GIF in README (Drone Navigation or Car Circuit)
- [ ] Track metrics: GitHub stars, npm downloads, demo page views

---

## Phase 3 — Viral Demos (2 weeks)

> Classic games everyone recognizes. These get shared.

- [ ] **Flappy Bird** — AI masters Flappy in your browser
- [ ] **Snake** — the classic, with growing snake visible
- [ ] **Dino Chrome** — the offline Chrome game
- [ ] Each demo: standalone page at `/demos/<slug>/`, deployed, shareable URL
- [ ] Each demo: 60-sec video for Twitter

These are engineered for virality. "AI learns Flappy Bird in JavaScript" is a tweet magnet.

---

## Phase 4 — Advanced Algorithms (2 weeks)

> Continuous action spaces for real game AI.

- [ ] **SAC** (Soft Actor-Critic) — continuous actions (steering angle, throttle)
- [ ] **A2C** — lightweight alternative to PPO
- [ ] Upgrade Drone Navigation + Car Circuit to continuous steering with SAC — smoother control
- [ ] Benchmark: DQN vs PPO vs SAC on the same env

---

## Phase 5 — Multi-Agent & Self-Play (3 weeks)

> The next level of RL.

- [ ] **Multi-agent API**: multiple agents in the same environment
- [ ] **Self-play**: agent trains against past versions of itself
- [ ] Demo: **Pong** — two agents learning to beat each other
- [ ] Demo: **Sumo** — two agents wrestling in a circle

---

## Phase 6 — Pre-Trained Models Hub (3 weeks)

> HuggingFace for RL agents.

- [ ] Upload API: `agent.publish('username/model-name')`
- [ ] Download API: `IgnitionEnv.loadAgent('username/model-name')`
- [ ] Gallery page: browse published agents
- [ ] Top models: car racing, Snake champion, Flappy master, drone pilot
- [ ] Leaderboard per environment

---

## Phase 7 — DX Tooling (2 weeks)

> Make it delightful to use.

- [ ] `create-ignitionai-app` — starter template with env + demo
- [ ] Web dashboard: live training visualization (start/stop/compare runs)
- [ ] Replay viewer: step through past episodes for debugging
- [ ] VS Code snippets extension

---

## Phase 8 — Ecosystem Integrations (ongoing)

> Meet developers where they are.

- [ ] **Three.js Journey integration**: lesson on RL agents
- [ ] **Unity Sentis export guide**: step-by-step tutorial ✅ (shipped as docs tutorial)
- [ ] **Unreal NNE export guide**
- [ ] **Godot export** (GDExtension via ONNX Runtime)
- [ ] **React Three Fiber starter kit**
- [ ] **PlayCanvas integration**

---

## Phase 9 — Monetization (when ready)

> Only after adoption. Don't put the cart before the horse.

**Not before Phase 6 minimum.** The framework must be widely used and loved before any commercial offering.

Possible models (ranked by feasibility):

1. **Enterprise support & consulting** — game studios, XR companies, educational institutions
2. **Cloud training** — offload heavy training to GPU cloud (like Replicate/Modal)
3. **Dashboard SaaS** — hosted version of the web dashboard with team features
4. **Courses** — paid tutorials on building game AI with IgnitionAI
5. **Dual license** — MIT for open-source, commercial license for proprietary

**Never**: close-source the core framework, add paid algos, lock ONNX export behind a paywall.

---

## Optional — Additional Demos

> Build when time allows, for the gallery.

- [x] Drone navigation (target chasing with rigid-body physics)
- [ ] Marble on tilting platform
- [ ] Rocket landing (SpaceX vibe)
- [ ] Robot arm (pick & place)
- [ ] Atari Breakout clone
- [ ] Bipedal walker

---

## Guiding Principles

1. **Framework first, product second** — the core library is the hero. Everything else supports it.
2. **Open-source forever** — MIT license, no lock-in, no dark patterns.
3. **Creative devs first** — Three.js / R3F users are the primary audience, not ML researchers.
4. **Browser-native** — if it doesn't work in the browser, it doesn't ship.
5. **Zero config > full control** — defaults must work. Advanced users get escape hatches.
6. **Ship > polish** — iterate in public. Break things, learn fast.
7. **From brain to software** — the friction between "I have an idea" and "I see it running" should be minutes, not weeks.

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
