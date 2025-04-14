# 🧭 IgnitionAI - Project Roadmap

This document outlines the phased development of **IgnitionAI** — a modular, browser-friendly framework for intelligent agent simulation and reinforcement learning.

---

## ✅ Phase 1 — Core Logic (MVP)

> ⚙️ Goal: Run agent-environment logic headlessly (no UI)

✅ Roadmap for "RL algo first"
Phase A — @ignitionai/backend-tfjs only
Implementing classic algorithms with TensorFlow.js

1. 🔁 Q-learning (tabular) – minimalist JS version
without neural networks
✅ Implemented Q-Table agent with state/action lookup
✅ Added tests for basic functionality

2. 🧠 DQN – Deep Q-Network
✅ Implemented MLP simple input → hidden → output
✅ Added replay buffer with experience sampling
✅ Implemented target network with periodic updates
✅ Added epsilon-greedy exploration/exploitation
✅ Loss function based on TD error
✅ Unit tests with training validation

3. 🧘‍♂️ PPO – Policy Gradient
✅ Created initial PPO agent skeleton
- [ ] Implement Actor-Critic model
- [ ] Implement episode-based training
- [ ] Add policy and value loss functions

---

## ✅ Phase 1.5 — Backend Infrastructure

> 🧰 Goal: Create robust, multi-environment backend support

✅ Created modular monorepo structure
✅ Implemented robust backend selection system
✅ Added support for all major TensorFlow.js backends:
  - WebGPU (experimental)
  - WebGL
  - CPU
  - WASM
✅ Added helper utilities for backend detection and info
✅ Added comprehensive model management system:
  - IndexedDB local storage
  - Hugging Face Hub integration with authentication
  - Automatic model serialization/deserialization
  - Checkpoint system with:
    - Regular checkpoints (step-based)
    - Best model checkpoints
    - Automatic retry with exponential backoff
  - Model versioning and metadata
✅ Added robust error handling and logging
✅ Comprehensive unit tests and integration tests

---

## 🚀 Phase 2 — R3F Visualisation

> 🎮 Goal: Make the agent & target visible in a 3D scene

✅ `@ignitionai/r3f`: add `AgentMesh`, `TargetMesh`, `useAgent`
✅ `@ignitionai/demo-target-chasing`: setup Vite + R3F scene
✅ Add training monitoring and auto-stop functionality
✅ Display step count and reward in the UI
✅ Implement real-time model updates
- [ ] Add training controls and visualization
- [ ] Optimize performance for longer training sessions
- [ ] Add ability to save/load models from the UI

---

## ✅ Phase 3 — TFJS Backend (Training & Inference)

> 🧠 Goal: Train and run a model directly in the browser

✅ `@ignitionai/backend-tfjs`: built simple MLP model with configurable layers
✅ Implemented `train()` and `predict()` APIs via DQN agent
✅ Added model serialization with `save()` and `load()`
✅ Added support for Hugging Face Hub integration
✅ Created streamlined `Agent` class interface
✅ Added comprehensive training utilities:
  - Progress tracking
  - Performance metrics
  - Model checkpointing
  - Training visualization
✅ Implemented browser-based training with Three.js visualization
✅ Added automatic checkpoint saving for best models

---

## 🚀 Phase 4 — ONNX Runtime Backend (Inference-only)

> ⚡ Goal: Run optimized pre-trained models in production

✅ Created initial package structure for ONNX backend
- [ ] Implement ONNX Runtime Web integration
- [ ] Add `.onnx` model loading and inference
- [ ] Create `InferenceBackend` wrapper
- [ ] Add model conversion utilities (TFJS → ONNX)

---

## 🚀 Phase 5 — Advanced Environments

> 🌍 Goal: Create more complex environments for agent training

- [ ] Implement grid-based environments (maze, pathfinding)
- [ ] Add physics-based environments (pendulum, cartpole)
- [ ] Create multi-agent environments
- [ ] Add environment customization tools
- [ ] Implement environment visualization tools

---

## 🚀 Phase 6 — Advanced Algorithms

> 🧠 Goal: Implement more sophisticated RL algorithms

- [ ] Implement DDPG (Deep Deterministic Policy Gradient)
- [ ] Add SAC (Soft Actor-Critic)
- [ ] Implement A2C (Advantage Actor-Critic)
- [ ] Add support for custom algorithm implementations
- [ ] Create algorithm comparison tools

---

## 🚀 Phase 7 — Deployment & Production

> 🚢 Goal: Make the framework production-ready

- [ ] Add comprehensive documentation
- [ ] Create example applications
- [ ] Implement CI/CD pipeline
- [ ] Add performance optimization tools
- [ ] Create deployment guides
- [ ] Add monitoring and analytics

---

Built with ❤️ by Salim (@IgnitionAI)
