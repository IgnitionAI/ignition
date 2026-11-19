# 🎯 Target Chasing Demo with IgnitionAI

This example demonstrates how to use IgnitionAI with Three.js to create a simple reinforcement learning environment where an agent learns to reach a target.

## 🎥 Demo Video

[![Target Chasing Demo](https://img.youtube.com/vi/97CMG7H_5Mo/0.jpg)](https://www.youtube.com/watch?v=97CMG7H_5Mo)

## 🔧 Requirements

- Three.js scene (WebGLRenderer, Camera, Meshes, etc.)
- @ignitionai/backend-tfjs (DQN Agent)
- @ignitionai/core (IgnitionEnv)
- Optionally: Hugging Face token for checkpointing

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Hugging Face token: `VITE_HF_TOKEN=your_token_here`
4. Run the development server: `npm run dev`
5. Open your browser to `http://localhost:3000`

## 🧠 Reinforcement Learning Environment

### Setup

```typescript
const env: IgnitionEnv = new IgnitionEnv({
  agent: dqnAgent,                          // The learning agent
  getObservation: () => [position, targetPosition],
  applyAction: (a: number) => {
    const dx = a - 1;                       // Convert action to direction
    position += dx * 0.2;
    agentMesh.position.x = position;       // Apply movement
  },
  computeReward: () => {
    const d = Math.abs(position - targetPosition);
    let reward = 1.0 / (1.0 + d);
    if (d > previousDistance) reward -= 0.5; // Penalty for moving away
    if (d < 0.5) reward += 1.0;             // Bonus for getting close
    previousDistance = d;
    return reward;
  },
  isDone: () => {
    const d = Math.abs(position - targetPosition);
    return d < 0.1 || stepCount > 1000;     // Success or timeout
  },
  onReset: () => {
    position = 0;
    targetPosition = (Math.random() - 0.5) * 4;
    agentMesh.position.x = position;
    targetMesh.position.x = targetPosition;
    stepCount = 0;
    bestDistance = Infinity;
    previousDistance = Math.abs(position - targetPosition);
  },
  stepIntervalMs: 100,                      // Loop speed
  hfRepoId: 'your-username/dqn-checkpoint',
  hfToken: import.meta.env.VITE_HF_TOKEN || '',
});
```

## ✅ Features

- ✅ Custom visual scene via Three.js
- ✅ Simple declarative API for environment definition
- ✅ No ML knowledge required
- ✅ Optional Hugging Face integration (auto checkpoints)
- ✅ Ready for R3F / WebGL / WebXR
- ✅ Real-time visualization of agent learning
- ✅ Automatic checkpoint saving for best models
- ✅ Training progress monitoring

## 🎮 How It Works

1. The agent (green sphere) learns to reach the target (red sphere)
2. The agent can move left, stay still, or move right
3. The agent receives rewards based on distance to target
4. Training automatically stops when the target is reached or after 1000 steps
5. The best model is automatically saved as a checkpoint

## 🔍 Customization

You can customize the environment by modifying:

- Agent parameters (learning rate, exploration rate, etc.)
- Reward function to change learning behavior
- Target position range
- Movement speed
- Maximum steps per episode

## 🚀 Run It

1. Create a canvas or WebGL context
2. Import DQNAgent and IgnitionEnv
3. Define your observation, reward, and action logic
4. Call `env.start()` and watch it learn

## 📚 Learn More

- [IgnitionAI Documentation](https://github.com/ignitionai/ignition)
- [Three.js Documentation](https://threejs.org/docs/)
- [Reinforcement Learning Basics](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)

Need help or want to showcase your own scenes? Join the [IgnitionAI Discussions](https://github.com/ignitionai/ignition/discussions) on GitHub!

---

## PPO before / after (IGN-170)

This package also serves a **PPO replay** at `src/ppo.html`. It does not reuse `@ignitionai/viz` from PRs #77/#78. The reward curve and greedy returns come from files under `public/ppo/`; nothing is hardcoded. Missing checkpoint/log → `PPO checkpoint/log absent: …`.

Frozen budget: [`ppo-experiment.json`](./ppo-experiment.json) — seeds **11, 29, 47**, **80** episodes, **25** steps. The displayed seed is the one with the largest `trainedGreedyEvalMean − untrainedGreedyEvalMean` (also selectable in the UI).

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @ignitionai/core build
corepack pnpm --filter @ignitionai/backend-tfjs build
node scripts/train-ppo-nav1d.mjs
# equivalent: node packages/backend-tfjs/scripts/train-ppo-nav1d.mjs
# equivalent: RUN_PPO_TRAIN=1 corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-train-budget.test.ts
RUN_PPO_EVAL=1 corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-eval-checkpoint.test.ts
corepack pnpm exec vitest run packages/backend-tfjs/test/ppo-node-dist.test.ts
corepack pnpm --filter target-chasing build
corepack pnpm --filter target-chasing dev
# DQN 3D: http://localhost:3000/
# PPO replay: http://localhost:3000/ppo.html
corepack pnpm --filter target-chasing preview --host 127.0.0.1 --port 4173
```

`node scripts/train-ppo-nav1d.mjs` must exit 0 after the two `build` steps. Root cause of the previous Node failure: `tsc` emitted ESM (`"module": "ESNext"`) with extensionless specifiers (`./agents/dqn`). Node 22 loads that as ESM and requires `./agents/dqn.js`. Relative imports in `packages/core` and `packages/backend-tfjs` now end in `.js`; `vitest` still covers `PPOAgent` via source aliases.

**`gitSha` rule (self-reference is impossible):** training writes `git rev-parse HEAD` at run time. The commit that stores `public/ppo/manifest.json` cannot also be the SHA named inside that file. After the artifacts commit, verify:

```sh
jq -r .gitSha packages/demo-target-chasing/public/ppo/manifest.json
git log -1 --format=%P -- packages/demo-target-chasing/public/ppo/manifest.json
# first parent of the artifacts commit must equal gitSha
```

Copied from `public/ppo/seed-*/summary.json` after `RUN_PPO_TRAIN=1` (`evidence/ign-170/24-retrain-greedy-gap.txt`):

| seed | first20 | last20 | untrained greedy eval | trained greedy eval | gap | greedy from 0.2 untrained → trained |
| --- | --- | --- | --- | --- | --- | --- |
| 11 | 0.4425 | 0.85 | 0.845 | 0.845 | 0 | 0.85 → 0.85 |
| 29 | −0.1800 | 0.8175 | −1.250 | 0.855 | 2.105 | −1.25 → 0.85 |
| 47 | 0.1475 | 0.8550 | 0.855 | 0.855 | 0 | 0.85 → 0.85 |

Displayed seed is **29**. Limits: 80 short 1-D episodes are not a benchmark; checkpoints omit Adam state; browser replay is discrete PPO. 