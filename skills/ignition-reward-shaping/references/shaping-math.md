# Shaping math and MountainCar notes

## Potential-based shaping

Ng, Harada, Russell (1999): adding

```text
F(s, a, s') = γ Φ(s') − Φ(s)
```

does not change the optimal policy when Φ depends only on state. The wrapper in `examples/skill-reward-shaping.ts` implements that term on top of `inner.reward()`.

On a true terminal, set Φ(s') = 0 so the last backup is `r − Φ(s)` rather than inventing value past the flag.

## MountainCar (stock env)

From `packages/environments/src/mountaincar.ts`:

- Sparse reward is `-1` every step (`reward()`, line 43).
- `done()` is true at position ≥ 0.5 **or** after 200 steps (lines 47–48). The class does not implement `terminated()` / `truncated()`.
- `IgnitionEnv` therefore treats timeout as `terminated: true` (`packages/core/src/ignition-env.ts` lines 96–97). That zeros the bootstrap on time limits. The example wrapper splits those cases without editing the env package.

Φ = position (observation[0]) is the tutorial’s distance-to-flag idea, in potential form. Velocity bonuses that reward `|v|` for its own sake are **not** potential-based and are easy to hack (spin in the valley).

## Car circuit (progress, not a copy-paste)

`packages/demo-car-circuit/src/circuit-env.ts` `reward()` (lines 135–147) uses a **progress delta** along the track plus alignment and centerline terms, with an off-track penalty and a lap bonus. That is the same family as Φ = track progress: standing still or driving backward is not rewarded. Keep those weights in the wrapper (or a subclass of the wrapper), not by forking physics.

## What to measure

Flag / lap / upright pole counts. Shaped return can go up while true success stays at zero (reward hacking) or go down while success rises (the potential is being “spent” to reach the goal). Report both; believe the event count.
