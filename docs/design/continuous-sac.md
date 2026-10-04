# Continuous actions and SAC — issue #33 implementation plan

## Problem and desired behavior

Current IgnitionEnv/algorithms infer a discrete action count. BoxSpace declarations alone do not deliver continuous learning. A caller must be able to supply finite vector bounds, train a genuine SAC policy, evaluate without updates and restore compatible checkpoints. Existing discrete APIs remain compatible.

## Scope and decisions

1. Core: explicit ContinuousTrainingEnv, ContinuousExperience and ContinuousAgent contracts. Reuse BoxSpace only as the boundary description; initially support nonempty one-dimensional vectors with finite strictly ordered bounds. Snapshot/validate bounds and finite observations/actions/rewards. Do not coerce discrete actions or silently clip invalid caller actions.
2. Continuous runner: separate API, serialized transitions and stop/reset behavior; capture terminal observation before reset. Termination suppresses bootstrap; truncation resets the episode but keeps bootstrap. Fixed action/observation dimensions; reject malformed agent outputs before environment mutation. Own copies of replay transitions.
3. TFJS SAC: seeded squashed Gaussian actor with reparameterization, clipped log standard deviation [-20,2], two independent critics and target critics. Actions use tanh then per-dimension affine scaling. Log density includes tanh and affine-scale Jacobians. Target is reward + gamma*(1-terminated)*(min(target critics)-alpha*log density). Actor minimizes alpha*log density-min(current critics). Use restricted variable lists, Adam, frozen Bellman targets and Polyak updates. Greedy inference uses tanh(mean) and mutates no weights, replay or RNG.
4. Defaults: hidden [32,32], learning rate 0.0003, gamma 0.99, alpha fixed 0.05, target interpolation tau 0.005, batch 64, replay 10000, uniform warmup 500, one gradient update per two interactions. Configuration validation is explicit; no adaptive-temperature claim.
5. Checkpoint: versioned JSON includes algorithm, contract, dimensions/bounds, architecture/configuration, actor, both critics and both targets, provenance and counters/RNG. Validate complete artifact before mutation. Fresh optimizer and replay on warm resume must be documented; inference round-trip must preserve outputs. Reject incompatible dimensions/bounds/versions and nonfinite weights. No exact optimizer/replay restoration claim.
6. Demo: actual scalar continuous point-mass control, canvas state and training/evaluation controls, save/load. Do not migrate existing demos or add it to the public catalogue until independently accepted.
7. Benchmark: predeclared protocol below, immutable raw failures and summaries, untrained baseline and greedy trained evaluation. No checkpoint cherry-picking: final scheduled weights only.

## Environment and protocol

Point-mass state [position,velocity], acceleration action [-2,2], dt=0.05. Each tick: velocity=(velocity+action*dt)*0.98, position+=velocity*dt. Reward=-(position^2+0.1*velocity^2+0.01*action^2). |position|>3 terminates with additional -10 reward; otherwise 100 ticks truncate. Reset position is uniform over [-1,-0.4] union [0.4,1], velocity uniform [-0.2,0.2]. Goal success: all of the final ten ticks have |position|<=0.1 and |velocity|<=0.15, without out-of-bounds termination. Observations are physical values, not hidden goal labels.

Training seeds [11,29,47,73,101], 20000 environment interactions per seed on TFJS CPU, same defaults/configuration. Evaluation seeds [211,307,419,509,601], 20 episodes per seed =100 episodes per policy, horizon 100. Baseline uses initial greedy actor; trained policy uses final greedy actor on identical independently reset evaluation scenarios. PASS learning threshold: at least four of five trained policies achieve >=70/100 successes, and overall mean episode cost decreases by >=50% from untrained baseline (cost=-return). Preserve all outcomes and timing. A failed threshold is a failed benchmark, not grounds to redefine this protocol after observing results.

## Acceptance and verification

- Public validation rejects malformed/empty/multidimensional/nonfinite bounds, inconsistent observations/actions and nonfinite rewards before relevant mutation; snapshots prevent caller changes to bounds.
- Mathematical owner checks independently establish density Jacobian, twin-minimum target, terminal/truncation distinction, restricted updates and target interpolation. Use public training/checkpoint boundaries where possible; no test-only production exports.
- Public runner episode/order/stop checks and deterministic inference unchanged-weights checks.
- Serializable checkpoint restores outputs and rejects incompatible/corrupt artifacts atomically.
- Genuine point-mass demo exercised in Chromium, all screenshots displayed; focused package tests, types and build pass.
- Execute the predeclared five-seed benchmark and retain raw results, provenance and failures. No issue closure before every acceptance criterion has authoritative evidence.

Out of scope: A2C, mandatory discrete-demo migration, adaptive entropy, self-play, remote model publication, deployment and general convergence promises.

Primary reference: https://github.com/openai/spinningup/blob/master/spinup/algos/pytorch/sac/sac.py and core.py. Our per-dimension affine density correction extends its symmetric scalar action scaling to the advertised vector-bound contract.

## Delivery status

This plan defines the full issue. Initial implementation lot supplies the public continuous boundary; runner, SAC, persistence, demo and benchmark remain required before completion.
