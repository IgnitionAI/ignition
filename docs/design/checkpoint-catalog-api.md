# Versioned checkpoint catalogue

Source-checkout API: build `@ignitionai/storage`, then import `checkpointCatalogSchema`, `getCheckpointArtifactURL` and `loadCatalogCheckpoint` from that package. Current published npm artifacts must be checked independently before using these exports.

Parse an untrusted catalogue with `checkpointCatalogSchema.parse`. The v1 catalogue contains model entries with an explicit algorithm/checkpoint format, versioned environment, observation and action contracts, provenance, declared licence, evaluation protocol/report and limitations. A box action specifies dimensions and finite ordered bounds; a discrete action specifies its count. Identifiers cannot be blank. Imported evaluation results remain declarations by their author, not independently verified measurements.

Artifacts use either a same-origin absolute local path or a structured public Hugging Face source (`type: huggingface`, `repoId`, full 40-character commit `revision`, relative `file`). Mutable branches and ambiguous paths are refused. Every descriptor requires the exact byte count (maximum 20 MiB) and SHA-256. Use HTTPS or localhost because validation requires Web Crypto. Public HF requests omit credentials; private repositories and uploading are outside this browser API.

Call `loadCatalogCheckpoint(entry, expectedContract, validateNative)` with the actual consumer's expected contract and native checkpoint parser. It checks compatibility before requesting data, bounds the streamed response, verifies its checksum and validates the envelope contract before invoking the native parser. The native consumer must also validate configuration and tensor shapes before replacing its current policy. Transport, integrity and native-format errors propagate; no fallback policy is returned.

The envelope format is `ignition-checkpoint-envelope-v1`, with `environment`, `contract` and `checkpoint`. The checked-in catalogue at `packages/web/data/checkpoints.json` and its public checkpoint files provide complete examples. The embedded point-mass consumer supports SAC only; other consumers must supply their own native validators.

## Embedded laboratory protocol

The gallery sends `{type: 'ignition:load-checkpoint', entry}` to its same-origin child after iframe load. The child verifies both message origin and parent source, applies all catalogue/native checks and replies with `{type: 'ignition:checkpoint-status', state: 'loaded' | 'error', detail, id}`. The parent accepts replies only from its current iframe at the same origin. Checkpoint weights are fetched through the public loader, not injected by messages.

Inference and quick evaluation preserve the loaded snapshot. Training modifies a local copy. Reloading recreates optimizer and replay state, so this is not exact training continuation. The five built-in checkpoints are final policies from the retained predeclared point-mass protocol, not a best-seed selection. MIT attribution refers explicitly to the licence declared in source package metadata; no separate weights licence document is invented.
