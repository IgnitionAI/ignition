# 🧭 IgnitionAI - Project Roadmap

This document outlines the phased development of **IgnitionAI** — a modular, browser-friendly framework for intelligent agent simulation and reinforcement learning.

---

## ✅ Phase 1 — Core Logic (MVP)

> ⚙️ Goal: Run agent-environment logic headlessly (no UI)

- [x] `@ignitionai/core` base structure with `Agent`, `InferenceBackend`, `MockBackend`
- [ ] Implement `TargetChasingEnvironment` (no UI)
- [ ] Create `step()` RL loop: observe → act → reward → learn
- [ ] Log rewards and done state in Node
- [ ] Add unit tests (Vitest)

---

## 🌐 Phase 2 — R3F Visualisation

> 🎮 Goal: Make the agent & target visible in a 3D scene

- [ ] `@ignitionai/r3f`: add `AgentMesh`, `TargetMesh`, `useAgent`
- [ ] `@ignitionai/demo-target-chasing`: setup Vite + R3F scene
- [ ] Display step count and reward in the UI

---

## 🤖 Phase 3 — TFJS Backend (Training & Inference)

> 🧠 Goal: Train and run a model directly in the browser

- [ ] `@ignitionai/backend-tfjs`: build simple MLP model
- [ ] Implement `train()`, `predict()`, `save()` APIs
- [ ] Plug into `Agent` class

---

## ⚡ Phase 4 — ONNX Runtime Backend (Inference-only)

> ⚡ Goal: Run optimized pre-trained models in production

- [ ] `@ignitionai/backend-onnx`: ONNX Runtime Web
- [ ] Load `.onnx` model and infer
- [ ] Implement `InferenceBackend` wrapper

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
