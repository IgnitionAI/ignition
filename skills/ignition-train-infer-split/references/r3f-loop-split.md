# Training loop vs render loop (React Three Fiber)

Source of the pattern: `packages/web/content/en/r3f.mdx` on SHA `343a769`.
This skill does not import `@ignitionai/viz` (unmerged PRs #77/#78).

## Two independent timers on one thread

**Render (R3F)** — `requestAnimationFrame` / `useFrame`. Reads env fields
(`playerX`, …) and writes mesh transforms. Must not call `env.step()`,
`runner.step()`, or `runner.train()`.

**Train or infer (IgnitionEnv)** — `setTimeout` gated by `stepIntervalMs`
(default 50 ms) and `stepsPerTick`. Started by `train()` / `start()` /
`infer()`. Yields between ticks so the browser can paint.

They share the `TrainingEnv` instance. Single-threaded JS: the two callbacks
never run at the same time.

`setSpeed(1)` keeps one step per 50 ms (smoother frames). `setSpeed(50)` batches
many learning steps per yield (faster training, heavier frames).

## Lifecycle

```ts
useEffect(() => {
  const runner = new IgnitionEnvTFJS(envRef.current);
  runner.train('dqn');
  return () => {
    runner.stop();
    runner.agent?.dispose?.();
  };
}, []);
```

Keep the env in `useRef` so React re-renders do not construct a new world.

After training, switch the **same** runner with `infer()`, or `stop()` +
`save` and load into another instance / process. Serving a frozen policy from
inside `useFrame` via `getAction(obs, true)` is valid if you never `remember`.
