# Frozen Circuit evaluation proof

Verified on 2026-10-04 using TensorFlow.js 4.22.0 CPU and source 229eb265.
The historical `circuit-evaluation-v1` protocol was defined in commit 513cf0f
before this run. It fixes distinct training/test oval geometries, three starting
waypoints, a 1500-transition episode limit and three target laps.

The executable trains an actual DQN through IgnitionEnvTFJS for 512 transitions
on the training geometry only, seed 11, hidden layer [16], batch size 32. The
agent performed 481 gradient updates. It then evaluates both geometries through
public evaluateCircuit/inferStep and repeats the held-out evaluation.

`report.json` records identical public weights/state hashes before and after
all evaluations, an exactly repeated held-out report, all controlled starts and
bounded episode accounting. This weak policy exited the track at all starts:
zero successful episodes on either geometry, 64 evaluation transitions on the
training circuit and 62 on the test circuit. Failures are preserved. Evaluation
correctness is the pass criterion; successful driving is a separate outcome.

`policy-weights.json` records the public weights and state used for identity
checking. Nonfinite numeric state sentinels (bestReward=-Infinity) are encoded
as strings to preserve their identity rather than collapsing them to JSON null.
The hash is SHA256 of JSON.stringify of the parsed object. The module reports
five observations and three steering actions; this is the legacy CircuitEnv,
separate from the current Racing contract and tutorial-specific environments.

The 17 evaluation/Circuit tests passed, including public inference-only calls,
JSON round-trip, final metrics across reset, complete lap times, invalid action
errors and yielding to browser tasks. Case names are retained in tests.json.
Review specification/standards PASS; standalone script strict typecheck PASS.

Reproduce from the checkout root with dependencies installed:

```bash
mkdir -p .scratch
packages/backend-onnx/node_modules/.bin/esbuild packages/demo-car-circuit/scripts/verify-evaluation.ts --bundle --platform=node --format=cjs --alias:@ignitionai/core=./packages/core/src/index.ts --alias:@ignitionai/backend-tfjs=./packages/backend-tfjs/src/index.ts --alias:@ignitionai/storage=./packages/storage/src/index.ts --external:@tensorflow/tfjs-node --outfile=.scratch/verify-circuit-evaluation.cjs
node .scratch/verify-circuit-evaluation.cjs .scratch/circuit-evaluation "$(git rev-parse HEAD)"
pnpm exec vitest run packages/demo-car-circuit/test/evaluation.test.ts packages/demo-car-circuit/test/circuit-env.test.ts --minWorkers=1 --maxWorkers=2
pnpm exec tsc --noEmit --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --strict --skipLibCheck --types node --typeRoots packages/web/node_modules/@types packages/demo-car-circuit/scripts/verify-evaluation.ts
```

These results verify the local evaluation API. Complete AI races, keyboard
player acceptance, deployed behavior and checkpoint restoration have their own
requirements and are not established by these reports.
