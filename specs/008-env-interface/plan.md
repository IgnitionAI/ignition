# Implementation Plan: Formal Environment Interfaces

**Branch**: `008-env-interface` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the callback-based IgnitionEnv API with two formal interfaces: `TrainingEnv` (train) and `InferenceEnv` (deploy). Breaking change. Migrate all demos.

## Technical Context

**Packages affected**: core (interfaces + IgnitionEnv rewrite), backend-tfjs (IgnitionEnvTFJS), backend-onnx (InferenceEnv), demo-gridworld, demo-cartpole, demo-mountaincar

## Constitution Check

All gates PASS. Breaking change justified: old API is 1 month old, no external users yet, new API is strictly better.

## New API

```ts
// TrainingEnv — the dev implements this
interface TrainingEnv {
  actions: string[] | number;
  observe(): number[];
  step(action: number | number[]): void;
  reward(): number;
  done(): boolean;
  reset(): void;
}

// InferenceEnv — minimal for production
interface InferenceEnv {
  observe(): number[];
  step(action: number | number[]): void;
}

// Usage — training
const env = new IgnitionEnv(new MyGameEnv());
env.train('dqn');

// Usage — inference
const env = new IgnitionInferenceEnv(new MyGameEnv(), { model: 'model.onnx' });
env.run();
```

## What changes where

```
packages/core/src/
  types.ts              → ADD TrainingEnv, InferenceEnv interfaces
  ignition-env.ts       → REWRITE: constructor takes TrainingEnv, kill callbacks
  schemas.ts            → REMOVE IgnitionEnvConfigSchema (replaced by interface validation)
  index.ts              → UPDATE exports

packages/backend-tfjs/src/
  ignition-env-tfjs.ts  → UPDATE: constructor takes TrainingEnv
  index.ts              → UPDATE exports

packages/backend-onnx/src/
  inference-env.ts      → NEW: IgnitionInferenceEnv class
  index.ts              → UPDATE exports

packages/demo-gridworld/src/
  gridworld-env.ts      → ADD: implements TrainingEnv (already has the methods)
  App.tsx               → SIMPLIFY: pass env object instead of wiring callbacks

packages/demo-cartpole/src/
  cartpole-env.ts       → ADD: implements TrainingEnv
  App.tsx               → SIMPLIFY

packages/demo-mountaincar/src/
  mountaincar-env.ts    → ADD: implements TrainingEnv
  App.tsx               → SIMPLIFY
```

## Validation strategy

Duck typing: check at construction that the env object has the required methods via typeof checks. Throw descriptive error for each missing method.
