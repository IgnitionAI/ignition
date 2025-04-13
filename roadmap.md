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

## 🚀 Phase 1.5 — Backend Infrastructure

> 🧰 Goal: Create robust, multi-environment backend support

✅ Created modular monorepo structure
✅ Implemented robust backend selection system
✅ Added support for all major TensorFlow.js backends:
  - WebGPU (experimental)
  - WebGL
  - CPU
  - WASM
✅ Added helper utilities for backend detection and info
✅ Comprehensive unit tests and error handling
- [ ] Add model serialization and loading

---

## 🌐 Phase 2 — R3F Visualisation

> 🎮 Goal: Make the agent & target visible in a 3D scene

- [ ] `@ignitionai/r3f`: add `AgentMesh`, `TargetMesh`, `useAgent`
- [ ] `@ignitionai/demo-target-chasing`: setup Vite + R3F scene
- [ ] Display step count and reward in the UI

---

## 🤖 Phase 3 — TFJS Backend (Training & Inference)

> 🧠 Goal: Train and run a model directly in the browser

✅ `@ignitionai/backend-tfjs`: built simple MLP model with configurable layers
✅ Implemented `train()` and `predict()` APIs via DQN agent
- [ ] Add model serialization with `save()` and `load()`
- [ ] Create streamlined `Agent` class interface

---

## ⚡ Phase 4 — ONNX Runtime Backend (Inference-only)

> ⚡ Goal: Run optimized pre-trained models in production

✅ Created initial package structure for ONNX backend
- [ ] Implement ONNX Runtime Web integration
- [ ] Add `.onnx` model loading and inference
- [ ] Create `InferenceBackend` wrapper

---

## 🧠 Phase 5 — Cognitive Agents (LLM & Planning)

> 📚 Goal: Enable agents with memory, reasoning and goals

- [ ] `@ignitionai/backend-langchain`: LLM-powered agent
- [ ] `@ignitionai/backend-vercelai`: edge-deployed AI actions
- [ ] Add simple text environment or RAG-driven simulation

---

## 🏁 Stretch Goals

- [ ] Physics-based environment (BallBalancer, CartPole3D)
- [ ] Multi-agent mode
- [ ] Export agent replay logs
- [ ] Web UI training dashboard
- [ ] OpenHub-like demo launcher

---

Built with ❤️ by Salim (@IgnitionAI)
