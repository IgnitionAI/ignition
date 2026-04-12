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
- **Demos 3D**: CartPole 3D, Car on Circuit (chase cam, HUD, minimap, trail, speed slider)
- **184+ tests** passing

---

## Phase 1 — Public Launch Prep (2 weeks)

> Everything needed to post "Show HN" without getting roasted.

### 1.1 Landing page
- [ ] Single-page site at `ignitionai.dev` (or similar domain)
- [ ] Hero: Car on Circuit demo embedded live
- [ ] 7-line code snippet with copy button
- [ ] "Install" command block
- [ ] 3 sub-demos linked (GridWorld, CartPole, MountainCar)
- [ ] Deploy on Vercel

### 1.2 Documentation site
- [ ] Docs at `ignitionai.dev/docs` (Vitepress or Astro Starlight)
- [ ] Getting Started (5 min tutorial)
- [ ] `TrainingEnv` API reference
- [ ] Algorithm guide (when to use DQN vs PPO vs Q-Table)
- [ ] ONNX export + Unity/Unreal deployment guide
- [ ] Architecture diagram

### 1.3 README + branding
- [ ] README with hero GIF of Car Circuit demo
- [ ] npm badges, license badge, build status
- [ ] Logo (simple, 5 min in Figma)
- [ ] Social card image for Twitter/OG

### 1.4 npm publish v0.1.0
- [ ] Publish all 6 packages via `scripts/publish.sh`
- [ ] Verify install in a fresh project
- [ ] Tag v0.1.0 in git

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
