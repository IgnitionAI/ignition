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
- **Environments**: `@ignitionai/environments` — GridWorld, CartPole, MountainCar (not yet published on npm)
- **Demos 2D**: GridWorld, CartPole, MountainCar
- **Demos 3D**: CartPole 3D, Car on Circuit (chase cam, HUD, minimap, trail, speed slider)
- **184+ tests** passing
- **Landing page** (`packages/web`): Cruip Stellar adapted to IgnitionAI brand — indigo palette, flame GIF logo, 3 inline SVG feature diagrams (ONNX pipeline, algorithm cards, R3F), 5-demo grid, real package install command
- **Documentation site** (`packages/web/content`, Nextra 4): 20 MDX pages — Introduction, Quickstart, verbose DQN/PPO/Q-Table pages with source-cited defaults, one page per backend package (core, backend-tfjs, backend-onnx, storage), R3F integration page, and 6 step-by-step tutorials (GridWorld, CartPole observations, MountainCar reward shaping, CartPole 3D, Car Circuit, ONNX→Unity). Single Vercel deployment serves `/` and `/docs` from one Next.js app. Specs 014–019.

---

## Phase 1 — Public Launch Prep

> Everything needed to post "Show HN" without getting roasted.

### 1.1 Landing page ✅
- [x] Single-page site under `packages/web` (Next.js 16 + Tailwind 4)
- [x] Hero: install command + "Train your first agent" messaging
- [x] 7-line code snippet in Quickstart section
- [x] 5-demo grid (GridWorld, CartPole, MountainCar, CartPole 3D, Car Circuit)
- [x] IgnitionAI brand: flame GIF logo, indigo palette, custom SVG feature diagrams
- [x] Real package install command (`@ignitionai/core` + `@ignitionai/backend-tfjs`)
- [ ] Deploy on Vercel (blocker: connect the web package to a Vercel project)
- [ ] Point a domain (`ignitionai.dev` or `docs.ignitionai.fr`)

### 1.2 Documentation site ✅
- [x] Docs at `/docs` via Nextra 4, same Next.js deployment as the landing (single Vercel build)
- [x] Introduction + Quickstart (<10 line training example, inlined CartPoleEnv)
- [x] Verbose algorithm pages (DQN, PPO, Q-Table) with source-cited defaults and failure-mode recipes
- [x] "How it works" — one page per backend package with annotated source walkthroughs
- [x] React Three Fiber page: why R3F-first + full training-loop/render-loop split
- [x] 6 step-by-step tutorials: GridWorld, CartPole observations, MountainCar reward shaping, CartPole 3D, Car Circuit, Export to Unity (ONNX)
- [x] Auto-generated sidebar via `_meta.js` contracts, dark-mode matches landing
- [x] 23 routes built statically

### 1.3 README + branding
- [x] README rewritten for v0.1 with current API + all demos
- [x] npm badges, license badge, test badge
- [x] Flame GIF logo (IgnitionAI brand asset)
- [ ] Social card image for Twitter/OG (not yet done)
- [ ] Hero GIF of Car Circuit demo in README (README currently text-only)

### 1.4 npm publish v0.1.0 ✅
- [x] `@ignitionai/core` published at 0.1.0
- [x] `@ignitionai/backend-tfjs` published at 0.1.0
- [x] `@ignitionai/backend-onnx` published at 0.1.0
- [x] `@ignitionai/storage` published at 0.1.0
- [x] `@ignitionai/environments` published at 0.1.0 (ships `CartPoleEnv`, `GridWorldEnv`, `MountainCarEnv`)
- [x] Docs updated post-publish: "publish pending" callouts removed, Quickstart imports `CartPoleEnv` from `@ignitionai/environments` directly
- [ ] Tag v0.1.0 in git once the post-publish commit is merged

**Known framework bug surfaced during docs**: `backend-tfjs/src/defaults.ts:3-13` disagrees with `agents/dqn.ts:43` on `targetUpdateFrequency` (100 vs 1000). Docs cite the runtime value (1000). Needs a cleanup commit in the framework after merge.

---

## Phase 2 — Launch (1 week)

> Get the framework in front of the right people.

- [ ] **Blog post**: "How I built ML-Agents in JavaScript" (dev.to + personal blog)
- [ ] **Twitter thread**: video of Car Circuit learning to drive + 10-line code
- [ ] **Show HN**: "IgnitionAI — Reinforcement Learning framework for JavaScript"
- [ ] **Reddit r/reinforcementlearning + r/javascript**
- [ ] **Product Hunt** submission
- [ ] **Discord server**: community + support channel
- [ ] Track metrics: GitHub stars, npm downloads, demo page views

---

## Phase 3 — Viral Demos (2 weeks)

> Classic games everyone recognizes. These get shared.

- [ ] **Flappy Bird** — AI masters Flappy in your browser
- [ ] **Snake** — the classic, with growing snake visible
- [ ] **Dino Chrome** — the offline Chrome game
- [ ] Each demo: standalone page, deployed, shareable URL
- [ ] Each demo: 60-sec video for Twitter

These are engineered for virality. "AI learns Flappy Bird in JavaScript" is a tweet magnet.

---

## Phase 4 — Advanced Algorithms (2 weeks)

> Continuous action spaces for real game AI.

- [ ] **SAC** (Soft Actor-Critic) — continuous actions (steering angle, throttle)
- [ ] **A2C** — lightweight alternative to PPO
- [ ] Upgrade Car Circuit to continuous steering with SAC — smoother driving
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
- [ ] Top models: car racing, Snake champion, Flappy master
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
- [ ] **Unity Sentis export guide**: step-by-step tutorial
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

- [ ] Drone hover (thrust balance)
- [ ] Marble on tilting platform
- [ ] Rocket landing (SpaceX vibe)
- [ ] Robot arm (pick & place)
- [ ] Atari Breakout clone

---

## Guiding Principles

1. **Framework first, product second** — the core library is the hero. Everything else supports it.
2. **Open-source forever** — MIT license, no lock-in, no dark patterns.
3. **Creative devs first** — Three.js / R3F users are the primary audience, not ML researchers.
4. **Browser-native** — if it doesn't work in the browser, it doesn't ship.
5. **Zero config > full control** — defaults must work. Advanced users get escape hatches.
6. **Ship > polish** — iterate in public. Break things, learn fast.

---

Built by [@salim4n](https://github.com/salim4n) / [@IgnitionAI](https://github.com/IgnitionAI)
