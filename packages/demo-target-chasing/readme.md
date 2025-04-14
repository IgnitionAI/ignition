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