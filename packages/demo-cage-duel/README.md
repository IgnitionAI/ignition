# The Crucible — Ignition cage duel

Full-screen browser duel with Blender-authored cage and armoured characters. Visual inspiration: grimdark science fiction and the directional guard readability of For Honor. No purchased or extracted game assets. The [atelier](http://127.0.0.1:3033/atelier.html) inspects the same GLBs used in combat; [source and build instructions](art/README.md). This is a stylized prototype, not an AAA quality claim or an official Warhammer product.

## Run

From the repository root: `pnpm --filter demo-cage-duel dev`, then http://127.0.0.1:3033 . Build: `pnpm --filter demo-cage-duel build`. Typecheck: `pnpm --filter demo-cage-duel typecheck`. Tests: `pnpm exec vitest run packages/demo-cage-duel/test`.

## Agreed scope and implementation choices

Two armoured fighters, one axe each, three directional attacks, matching timed parry, held guard, movement, stamina and finite rounds. Desktop keyboard plus on-screen controls. Character-focused lobby, shoulder camera, projected directional telegraphs, minimal combat HUD and a modal training room. Explicit reference opponent; train a separate real Ignition Q-table in the browser then select it for a frozen duel. No neural network, self-play, online multiplayer, saved checkpoints or paid assets in this slice.

The public Duel step boundary governs contact, range, timing, stamina and round termination for rendering and training alike. Tests verify these observable combat outcomes and integration through IgnitionEnv.step/evaluation. Controls and visuals require a browser check as well.

Training uses the existing Ignition QTableAgent and IgnitionEnv, with five discretized observations (range, opponent phase, own phase, stamina, opponent attack direction) and eleven actions. Rendering uses articulated rigid parts. Fixed simulation tick: 100 ms; interpolated presentation. Maximum round: 60 simulation seconds. An attack has 400 ms startup and 600 ms recovery. A guard first raised within the last two ticks parries, otherwise blocks with chip damage. Inputs are sampled at simulation ticks.

Training opponents are deterministic reference controllers with seeds 1–97; separate evaluation uses ten seeds 101–1901 declared in learning.ts. This is a narrow same-environment evaluation, not proof of general play or human-level skill. Exploration uses the existing agent's Math.random and is not seeded. Report measured outcomes, including regressions; do not imply improvement simply because training finished. Policies live in memory and are lost on refresh.

## Acceptance

- A visitor can see both fighters and their armour detail, start a duel, move, attack, block, pause and restart.
- Attacks must telegraph and can miss; a timed parry differs from passive guard.
- Round completion freezes combat and reports a winner or draw.
- Start/stop training keeps UI responsive, and completed training is evaluated independently before being offered as an opponent.
- Reference and learned opponents remain explicitly identified.
- Browser rendering, controls, console, tests and build are checked. A human judgement of combat feel remains distinct from automated checks.

## Controls and presentation

ZQSD/WASD moves relative to the locked opponent. Up/left/right arrows select the attack and guard direction. Space/left click attacks; Shift/right click guards. A guard must match the incoming direction; continuously changing an already held guard does not renew its parry window. Escape pauses. Touch buttons provide movement, direction, attack and guard on narrow screens. Opening training suspends the duel and closing it restores the previous pause state.

The Blender rigid pivots animate at runtime. This is a first combat animation pass, without authored animation clips or precise weapon collision. Contact is governed by simulation range/timing; visual refinement of foot planting, blade travel and boundary camera remains possible. Models use constant PBR materials, not baked cinematic textures.

## UX revision review

Standards: no documented violation; corrected per-frame movement detection to retain gait between simulation ticks.
Spec: corrected movement continuity and started the visible swing during the final windup tick so impact feedback follows its descent. Camera offset widened after browser inspection to keep the opponent visible.

Validation of the UX revision: desktop 1440×900, portrait 390×844 and landscape 844×390 inspected in the browser. Direction selection, attack, tactile guard, pause/training return checked; no browser warning/error on the clean session. Full suite passed 358 tests with 3 skipped; the subsequently added rigid-pivot regression passed with the package's 12 tests. Production build and typecheck pass (existing Three.js chunk-size warning). One live 60k-transition training run measured 0/10 wins before and 2/10 after; this is a single stochastic result, not a promised win rate. Mouse and keyboard held inputs are tracked independently after review.
