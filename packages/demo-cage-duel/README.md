# The Crucible — Ignition cage duel

Local first playable slice. Original procedural armoured characters and cage; visual inspiration: grimdark science fiction. No purchased or extracted game assets. The existing playable demo uses models authored directly in Three.js. New Blender-authored cage and marine assets are available in the [Blender atelier](http://127.0.0.1:3033/atelier.html), with [source and build instructions](art/README.md); they are not yet wired into the playable combat. This is a stylized demo, not an AAA quality claim or an official Warhammer product.

## Run

From the repository root: `pnpm --filter demo-cage-duel dev`, then http://127.0.0.1:3033 . Build: `pnpm --filter demo-cage-duel build`. Typecheck: `pnpm --filter demo-cage-duel typecheck`. Tests: `pnpm exec vitest run packages/demo-cage-duel/test`.

## Agreed scope and implementation choices

Two armoured fighters, one axe each, one attack, timed parry, held guard, movement, stamina and finite rounds. Desktop keyboard plus on-screen controls. Spectator mode for an immediate moving presentation. Explicit reference opponent; train a separate real Ignition Q-table in the browser then select it for a frozen duel. No neural network, self-play, online multiplayer, saved checkpoints, three-direction combat or paid assets in this slice.

The public Duel step boundary governs contact, range, timing, stamina and round termination for rendering and training alike. Tests verify these observable combat outcomes and integration through IgnitionEnv.step/evaluation. Controls and visuals require a browser check as well.

Training uses the existing Ignition QTableAgent and IgnitionEnv, with four discretized observations (range, opponent phase, own phase, stamina) and seven actions. Rendering uses articulated rigid parts. Fixed simulation tick: 100 ms; interpolated presentation. Maximum round: 60 simulation seconds. An attack has 400 ms startup and 600 ms recovery. A guard first raised within the last two ticks parries, otherwise blocks with chip damage. Inputs are sampled at simulation ticks.

Training opponents are deterministic reference controllers with seeds 1–97; separate evaluation uses ten seeds 101–1901 declared in learning.ts. This is a narrow same-environment evaluation, not proof of general play or human-level skill. Exploration uses the existing agent's Math.random and is not seeded. Report measured outcomes, including regressions; do not imply improvement simply because training finished. Policies live in memory and are lost on refresh.

## Acceptance

- A visitor can see both fighters and their armour detail, start a duel, move, attack, block, pause and restart.
- Attacks must telegraph and can miss; a timed parry differs from passive guard.
- Round completion freezes combat and reports a winner or draw.
- Start/stop training keeps UI responsive, and completed training is evaluated independently before being offered as an opponent.
- Reference and learned opponents remain explicitly identified.
- Browser rendering, controls, console, tests and build are checked. A human judgement of combat feel remains distinct from automated checks.
