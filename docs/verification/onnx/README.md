# ONNX round-trip evidence

The public verification script trained a seeded DQN through IgnitionEnvTFJS for
64 transitions, exported it, converted TFJS Layers → SavedModel → ONNX and
compared both numeric outputs and greedy actions on three fixed observations.
See `report.json` for tolerances, measured error, versions, source commit and
artifact SHA-256. `model.onnx` is the exact tested artifact, not a converged policy.

Reproduce using the commands in `packages/backend-onnx/examples/README.md`,
Python 3.11 and its pinned requirements. The script is
`packages/backend-tfjs/scripts/verify-onnx-export.ts`.
The current run used Node 20.19.2 and pnpm 10.8.0. This proves local conversion
and ONNX inference, not deployment or every supported architecture. Exporter
and runtime error handling have separate executable unit coverage.
