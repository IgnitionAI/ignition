# 🚀 IgnitionAI - Reinforcement Learning Made Simple

[![NPM Version](https://img.shields.io/npm/v/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)
[![License](https://img.shields.io/npm/l/@ignitionai/backend-tfjs?style=flat-square)](https://www.npmjs.com/package/@ignitionai/backend-tfjs)
[![Made with ❤️ by IgnitionAI](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F%20IgnitionAI-blueviolet?style=flat-square)](https://github.com/ignitionai)

---

IgnitionAI is designed to make Deep Reinforcement Learning **easy**, **modular**, and **production-ready**, especially within browser environments using technologies like WebGPU via TensorFlow.js.

# 📑 Table of Contents

- [Overview](#overview)
- [Packages](#packages)
- [Demo: Target Chasing (R3F)](#demo-target-chasing-r3f)
  - [Features](#features)
  - [Running the Demo](#running-the-demo)
- [Core Library Usage](#core-library-usage)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
    - [1. Import Modules](#1-import-modules)
    - [2. Create a DQN Agent](#2-create-a-dqn-agent)
    - [3. Create an Environment](#3-create-an-environment)
    - [4. Step Through Training](#4-step-through-training)
- [Tips](#tips)
- [Example: Reward Shaping](#example-reward-shaping)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

# Overview

This project provides a set of tools and libraries to facilitate the development and visualization of reinforcement learning agents directly in the browser. It leverages TensorFlow.js for backend computations (including WebGPU support) and React Three Fiber for 3D visualization.

---

# Packages

This is a monorepo managed with pnpm. Key packages include:

- **`packages/core`**: Contains the core `IgnitionEnv` class and shared utilities.
- **`packages/backend-tfjs`**: Implements RL agents (like DQN) using TensorFlow.js.
- **`packages/backend-onnx`**: (Planned) Backend for running inference using ONNX Runtime.
- **`r3f/target-chasing`**: A demo application showcasing a DQN agent learning in a 3D environment using React Three Fiber.

---

# Demo: Target Chasing (R3F)

Located in `r3f/target-chasing`, this demo provides a visual example of a DQN agent learning to navigate a 3D space to reach a target.

## Features

- **3D Visualization:** Uses React Three Fiber (R3F) and Rapier physics to render the agent, target, and environment.
- **Real-time Training:** Watch the agent learn in real-time in your browser.
- **Interactive UI Panels:**
    - **Training Controls:** Start, stop, and reset the training process. View basic stats like episode count, success rate, time, and current reward.
    - **Visualization Charts:** Real-time charts (using Recharts) displaying Reward, Loss (simulated), and Epsilon Decay (simulated) over training steps.
    - **Agent Configuration:** Modify hyperparameters (learning rate, gamma, epsilon settings, etc.) and basic network architecture (input/output size, hidden layers) without code changes. Click "Apply Configuration" to re-initialize the agent with new settings.
    - **Network Designer (Basic):** A visual drag-and-drop interface (using React Flow) to represent the network structure. Currently, this is primarily a visual aid; the actual network structure is defined via the Agent Configuration panel.

## Running the Demo

1.  Navigate to the demo directory: `cd r3f/target-chasing`
2.  Install dependencies (if not already done from the root): `pnpm install`
3.  Run the development server: `pnpm dev`
4.  Open the provided URL (usually `http://localhost:5173/`) in your browser.

---

# Core Library Usage

## Installation

```bash
pnpm install @ignitionai/backend-tfjs @ignitionai/core
# or
npm install @ignitionai/backend-tfjs @ignitionai/core
# or
yarn add @ignitionai/backend-tfjs @ignitionai/core
```

---

## Getting Started

Here's a basic example of using the core library components.

### 1. Import Modules

```tsx
import { DQNAgent } from '@ignitionai/backend-tfjs'
import { IgnitionEnv } from '@ignitionai/core'
```

---

### 2. Create a DQN Agent

Configure your agent. Note that these parameters can now be dynamically set via the UI in the demo.

```tsx
const agentConfig = {
  inputSize: 9,        // Size of the observation space
  actionSize: 4,        // Number of possible actions
  hiddenLayers: [64, 64], // Example hidden layers
  lr: 0.001,            // Learning rate
  gamma: 0.99,           // Discount factor
  epsilon: 0.9,         // Initial exploration rate
  epsilonDecay: 0.97,   // Epsilon decay per step
  minEpsilon: 0.05,      // Minimum exploration
  batchSize: 128,        // Batch size for training
  memorySize: 100000     // Experience replay memory size
};

const dqnAgent = new DQNAgent(agentConfig);
```

---

### 3. Create an Environment

Define the environment interactions.

```tsx
const trainingEnv = new IgnitionEnv({
  agent: dqnAgent,

  getObservation: () => {
    // Return an array of normalized values representing the current state.
    // Example: [agentPosX, agentPosY, targetPosX, targetPosY, ...]
    return [];
  },

  applyAction: (action: number | number[]) => {
    // Apply the chosen action to update your environment state.
    console.log("Applying action:", action);
  },

  computeReward: () => {
    // Return a numerical reward based on the new state after the action.
    return 0;
  },

  isDone: () => {
    // Return true if the episode should end (e.g., agent reaches goal, time limit exceeded).
    return false;
  },

  onReset: () => {
    // Reset the environment to a starting state for the next episode.
  }
});
```

---

### 4. Step Through Training

Integrate the `step()` function into your application's loop (e.g., a `requestAnimationFrame` loop or `useFrame` in R3F).

```tsx
// Example within a React component using R3F
import { useFrame } from '@react-three/fiber';

// ... inside your component
useFrame(() => {
  if (isTraining) { // Assuming 'isTraining' is a state variable
    trainingEnv.step();
  }
});
```

Each call to `step()` performs one cycle:
- Get observation -> Agent chooses action -> Apply action -> Compute reward -> Store experience -> Potentially train model -> Check if done -> Reset if done.

---

# Tips

- **Normalize Observations:** Ensure your observation values are scaled, typically between 0 and 1 or -1 and 1, for better network performance.
- **Reward Shaping:** This is critical. Provide intermediate rewards to guide the agent. Don't rely solely on a large reward at the very end. See the example below.
- **Visual Feedback:** Use the provided visualization charts and 3D view in the demo to understand agent behavior and debug issues.
- **Hyperparameter Tuning:** Experiment with learning rate, epsilon decay, network architecture, etc., using the configuration panel in the demo.

---

# Example: Reward Shaping

**Bad reward shaping (Sparse Reward):**

```tsx
// Only rewards reaching the exact goal
computeReward: () => {
  return agentReachedTarget ? 100 : 0;
}
```

**Good reward shaping (Dense Reward):**

```tsx
// Encourage progress toward the goal
computeReward: () => {
  const distNow = distance(currentAgentPos, targetPos);
  const distBefore = previousDistance; // Store distance from the previous step

  // Reward for getting closer
  let reward = (distBefore - distNow) * 10;

  if (agentReachedTarget) {
    reward += 100; // Bonus for reaching the goal
  }

  // Optional: Small penalty for existing (encourages faster completion)
  // reward -= 0.1;

  previousDistance = distNow; // Update distance for the next step
  return reward;
}
```

✅ Good reward shaping encourages better learning and faster convergence!

---

# Roadmap

See the [roadmap.md](./roadmap.md) file for planned features and development phases.

---

# Contributing

Contributions are welcome! Please refer to the [CONTRIBUTION_NOTES.md](./CONTRIBUTION_NOTES.md) for details on recent changes and potential areas for future development.

---

Built with ❤️ by Salim (@IgnitionAI)

