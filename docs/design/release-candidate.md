# Release candidate preparation — epic #47

The maintainer approved preparation of version 0.2.0 for the five modular
packages on 2026-10-05, retaining the umbrella local-only, and confirmed
Salim Laimeche as copyright holder. Years 2025–2026 follow repository history.
Publication, merge and deployment remain separate steps.

## Proposed scope

Prepare the five existing modular packages together: core, backend-tfjs,
backend-onnx, storage and environments. Keep the ignitionai umbrella local-only.
Do not overwrite the public 0.1.0 release or advertise workspace-only changes
as already available from npm. Prepare version 0.2.0; it is not yet published.

## Candidate release notes

- Core: compatible episode termination/truncation handling, continuous-action
  contracts/runner and multi-agent runner with per-agent transitions.
- TFJS: repaired PPO public training loop, Double DQN selection/evaluation,
  unified DQN target-update default of 100, and SAC with bounded actions.
  Consumers relying on the historical direct-agent default of 1000 should
  configure that value explicitly. Recorded benchmark data remains historical.
- Storage: versioned checkpoint catalogue, compatibility/integrity checks and
  repaired TFJS artifact serialization and authenticated HF load requests.
  Authenticated remote round-trip is still not proven without dedicated secrets.
- Environments: existing GridWorld, CartPole and MountainCar public environments.
  Car Circuit simulation remains a demo, not an additional published export.
- ONNX: retained train/export/convert/infer workflow and explicit runtime entry
  points. Python conversion remains an external setup step.
- Packaging: separate ESM/CommonJS outputs and matching declarations make
  packed packages consumable natively on Node 20.0.0, 20.19.2 and 22.23.3 in
  both modes; archives exclude compiled tests and build metadata. This matrix
  covers the CI's Node 20/22 families; licence distribution and final revision
  gates remain prerequisites.

## Delivery checklist

1. Resolve #22/#23 acceptance and #45 copyright/licence distribution; preserve
   #17's human race requirement and #31's authenticated remote requirement.
2. Approve public API scope and candidate version. Review compatibility, update
   changelog/package versions and regenerate locked workspace dependencies.
3. Build with the frozen lockfile; run owner suites, lint/typechecks and Node
   support matrix. Record the exact source revision and all skips/blockers.
4. Pack only the five approved packages and inspect each archive. Install those
   exact tarballs in an independent consumer; exercise exports, declarations and
   examples. Record checksums. Confirm licence contents and workspace dependency
   rewriting. Prevent resolving the consumer through source aliases.
5. Obtain green required remote gates and review the immutable candidate. The
   current local archive proofs do not satisfy a final release gate.
6. A maintainer authorizes publication separately; verify registry permissions
   and publish the reviewed artifacts in dependency order. Read back registry
   versions and integrity, then install from the registry in a fresh consumer.
7. Tag the verified source and publish reviewed release notes only after the
   external package verification succeeds. Verify web deployment separately.

## Recovery plan

If a candidate fails before publication, preserve evidence and fix/rebuild the
candidate. If a published candidate is defective, direct consumers to the last
verified version and prepare a corrected version. A maintainer decides registry
deprecation/tag adjustments; record the affected versions and reason. Do not
claim removing a Git tag reverts installed packages or a deployed site. Site
recovery uses its previous verified deployment and a separate public readback.
