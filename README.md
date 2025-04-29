
# 🚀 IgnitionAI - Reinforcement Learning Made Simple

[![NPM Version](https://img.shields.io/npm/v/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)
[![License](https://img.shields.io/npm/l/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)
[![Made with ❤️ by IgnitionAI](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F%20IgnitionAI-blueviolet?style=flat-square)](https://github.com/ignitionai)

---

# 📑 Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
  - [1. Import Modules](#1-import-modules)
  - [2. Create a DQN Agent](#2-create-a-dqn-agent)
  - [3. Create an Environment](#3-create-an-environment)
  - [4. Step Through Training](#4-step-through-training)
- [Tips](#tips)
- [Example: Reward Shaping](#example-reward-shaping)

---

# Installation

```bash
npm install @ignitionai/backend-tfjs @ignitionai/core
```

or

```bash
yarn add @ignitionai/backend-tfjs @ignitionai/core
```

---

# Getting Started

## 1. Import Modules

```tsx
import { DQNAgent } from '@ignitionai/backend-tfjs'
import { IgnitionEnv } from '@ignitionai/core'
```

---

## 2. Create a DQN Agent

```tsx
const dqnAgent = new DQNAgent({
  inputSize: 10,        // Size of the observation space
  actionSize: 4,        // Number of possible actions
  lr: 0.005,            // Learning rate
  gamma: 0.9,           // Discount factor
  epsilon: 0.5,         // Initial exploration rate
  epsilonDecay: 0.99,   // Epsilon decay per step
  minEpsilon: 0.1,      // Minimum exploration
  batchSize: 64,        // Batch size for training
  memorySize: 10000     // Experience replay memory size
})
```

---

## 3. Create an Environment

```tsx
const trainingEnv = new IgnitionEnv({
  agent: dqnAgent,

  getObservation: () => {
    // Return an array of normalized values.
    return []
  },

  applyAction: (action: number | number[]) => {
    console.log("Applying action:", action)
    // Apply the action to update your environment.
  },

  computeReward: () => {
    // Return a numerical reward based on the new state.
    return 0
  },

  isDone: () => {
    // Return true if episode should end (e.g., agent reaches goal).
    return false
  },

  onReset: () => {
    // Reset environment for the next episode.
  }
})
```

---

## 4. Step Through Training

```tsx
useFrame(() => {
  if (isTraining) {
    trainingEnv.step()
  }
})
```

Each call to `step()` will:
- Get the current observation.
- Let the agent choose an action.
- Apply the action to the environment.
- Calculate a reward.
- Store the experience (state, action, reward, next state).
- Train the model periodically.
- Reset if the episode ends.

---

# Tips

- **Normalize** your observations (example: coordinates between 0 and 1).
- **Reward shaping** is crucial: give small intermediate rewards, not just final rewards.
- **Visual feedback** (like graphs or dashboards) can greatly help debugging.
- **Tune epsilon decay** to control exploration vs exploitation.

---

# Example: Reward Shaping

Bad reward shaping:

```tsx
// Only rewards success
computeReward: () => {
  return agentReachedTarget ? 100 : 0
}
```

Good reward shaping:

```tsx
// Encourage progress toward the goal
computeReward: () => {
  const distBefore = distance(prevAgentPos, targetPos)
  const distNow = distance(currentAgentPos, targetPos)
  
  let reward = (distBefore - distNow) * 10; // Reward getting closer
  
  if (agentReachedTarget) {
    reward += 100; // Bonus for reaching the goal
  }
  
  return reward;
}
```

✅ Encourages better learning, faster convergence!

# 🚧 Project Status
**IgnitionAI is currently on hold.**

I'm actively searching for creative Three.js developers interested in collaborating to build meaningful interactive environments.
At this stage, I'm still learning a lot about Three.js, especially browser physics (Rapier), and I need strong creative partners.

If you’re passionate about 3D worlds, RL training playgrounds, and want to co-create an awesome framework —
contact me! 🚀

---

# ✨ Let's Build Smarter Agents!
> IgnitionAI is designed to make Deep Reinforcement Learning **easy**, **modular**, and **production-ready**.

---

