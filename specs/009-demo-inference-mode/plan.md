# Implementation Plan: Demo Inference Mode

**Branch**: `009-demo-inference-mode` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

Add `infer()` method to IgnitionEnv that runs observe → getAction → step with no learning. Add Inference/Training toggle button + visual border to all 3 demos.

## Architecture

### Core change: `IgnitionEnv.infer()` method

Add to IgnitionEnv base class:

```ts
// New method — inference loop (no learning)
public inferStep(): Promise<void>
  → observe → getAction(greedy) → env.step — no remember, no train

public infer(): void
  → starts inference loop (like start() but calls inferStep)

// Agent needs a way to force greedy
interface AgentInterface {
  getAction(obs, greedy?: boolean): Promise<number>  // add optional greedy flag
}
```

### Demo changes

Each demo's Controls.tsx gets a Training/Inference toggle. App.tsx calls `env.infer()` or `env.train()`. Store gets `mode: 'training' | 'inference' | 'stopped'`. Canvas border color reacts to mode.
