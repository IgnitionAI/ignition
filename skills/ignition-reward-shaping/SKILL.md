---
name: ignition-reward-shaping
description: Design and verify a reward function for IgnitionRL. Use when the task is sparse or dense rewards, potential-based shaping, scale and sign, time penalties, termination vs truncation, reward hacking, or a pre-training checklist. Wrap the env; do not edit physics. Measure true success (e.g. MountainCar flag), never claim learning from shaped return alone.
---

# ignition-reward-shaping

Design the **reward the agent trains on** without changing environment physics. Implement shaping as a `TrainingEnv` wrapper. Measure the **real event** (flag, laps, fall), not the shaped scalar.

## When to use

- The agent idles, loops, or never sees a success event.
- Every transition looks like the same number (sparse / constant).
- You are about to train and need a checklist.
- You want potential-based shaping, a time penalty, or a sign/scale change.

Do **not** use this skill to change `lr`, network size, or algorithms. Fix the signal first.

## API (`@ignitionai/*` 0.1.0)

Implement `TrainingEnv` (`packages/core/src/types.ts:95-112`): `actions`, `observe()`, `step()`, `reward()`, `done()`, optional `terminated()` / `truncated()`, `reset()`.

`IgnitionEnv` reads reward **after** `step()` (`packages/core/src/ignition-env.ts:93-97`):

```ts
this.env.step(action);
const observation = this.env.observe();
const reward = this.env.reward();
const truncated = this.env.truncated?.() ?? false;
const terminated = this.env.terminated?.() ?? (this.env.done() && !truncated);
```

If the env omits `truncated()`, a time limit inside `done()` is stored as `terminated: true` and **zeros the bootstrap**.

Built-in MountainCar (`packages/environments/src/mountaincar.ts`): `reward()` is always `-1` (line 43); `done()` is position ≥ 0.5 **or** 200 steps (lines 47–48). No `terminated` / `truncated`.

Train with `IgnitionEnvTFJS` (`packages/backend-tfjs/src/ignition-env-tfjs.ts:26`). `train()` starts a timer loop (`packages/core/src/ignition-env.ts:41`); call `stop()` (`packages/core/src/ignition-env.ts:147`) and drive `step()` yourself in scripts.

Q-table on MountainCar **must** pass `stateLow` / `stateHigh` (`packages/backend-tfjs/src/types.ts:50-51`). Defaults are `[0,1]` per dim and will collapse the valley into one bin.

## Wrapper, not a fork

Copy `RewardShapingWrapper` from `examples/skill-reward-shaping.ts`. Pattern:

```text
r′ = scale · r_inner + (γ Φ(s′) − Φ(s)) + timePenalty
```

Φ is a function of the **observation only**. Inner `MountainCarEnv` stays stock.

Potential-based term (Ng, Harada, Russell 1999) does not change the optimal policy when Φ is a state potential. Extra bonuses that are not differences of Φ (for example “+|velocity| forever”) **can** change the optimum — that is how hacking starts.

Progress on the car circuit (`packages/demo-car-circuit/src/circuit-env.ts:135-147`) is the same idea: reward **forward progress**, not “still on the track”. Put that as Φ = progress (or F ≈ Δprogress) in the wrapper.

## Sparse vs dense

| | Sparse | Dense |
|---|---|---|
| Signal | Event only (`-1`/step until flag) | Almost every transition differs |
| Failure | Replay looks like noise | Agent may farm the dense term |
| Fix | Add Φ or a progress delta | Keep a true-event bonus; keep Φ bounded |

MountainCar stock is sparse: every row in the replay buffer has `reward = -1` until the flag. If random policy never hits the flag, DQN/Q-table have nothing to bootstrap from.

## Scale, sign, time, termination

- **Scale** (`scale`): if `|F|` dwarfs `r`, the original task disappears. If `|F|` is tiny, you are still sparse.
- **Sign**: `scale: -1` trains the opposite policy. Check one transition by hand.
- **Time penalty**: constant negative (`timePenalty`). Keep it smaller than progress per step.
- **Termination**: `terminated` = flag / crash / win. `truncated` = max steps. The example `MountainCarTerminalWrapper` splits stock MountainCar without editing the package.

## Traps

1. **Exploitation loops.** Φ increases then decreases (rock forever in the valley, circle a waypoint). Prefer Φ that is **monotonic in true progress**, or zero Φ at true terminals.
2. **Reward hacking.** Maximizing r′ without the event (velocity bonus, sitting next to a heat map, ending the episode for a spurious `done`).
3. **Contradicting the objective.** Time penalty so large the optimal policy is suicide. Sign error. Timeout marked `terminated` so “survive 200 steps” looks like a goal.

## Checklist (mandatory)

Full list: [references/checklist.md](references/checklist.md). Minimum:

- [ ] Named true success event
- [ ] Sparse vs dense decided
- [ ] Shaping is a wrapper; env physics unchanged
- [ ] Hand-calculated transition matches `r′`
- [ ] `terminated` / `truncated` split
- [ ] Seeds (≥ 3) and budget written **before** `step()`
- [ ] Log flag/event counts, including zeros
- [ ] Same comparison on unshaped vs shaped

## Executable example

`examples/skill-reward-shaping.ts`

- Hand-checkable wrapper (`RewardShapingWrapper`).
- MountainCar comparison: seeds `[7, 19, 31]`, 40 episodes, 200 steps, `qtable` with explicit bounds.
- Success = `position >= 0.5`, from `StepResult.terminated` after the terminal split — **not** `sumReportedReward`.

```ts
import { compareMountainCarRewards } from './examples/skill-reward-shaping';

const report = await compareMountainCarRewards();
// report.rows[].flagSuccesses is the metric
```

Math notes: [references/shaping-math.md](references/shaping-math.md).

## Do not

- Edit `packages/environments` or any package to “fix” reward.
- Claim convergence without the event count.
- Skip failed seeds.
- Use unpublished APIs.
