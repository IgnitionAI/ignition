# Validation — 2026-09-07

Scope: original stylized procedural browser duel, integrated with real Ignition Q-learning. Local validation, no deployment or public performance guarantee.

## Automated checks

- `npm test`: successful recursive workspace build followed by Vitest: 52 files passed, 3 skipped; 354 tests passed, 3 skipped.
- `npm run lint`: successful. The web package explicitly skips its existing ESLint check because of its ESLint 9 configuration incompatibility; this is not a clean web lint claim. The new demo runs TypeScript validation.
- Final `pnpm --filter demo-cage-duel typecheck` and `build`: successful.
- Demo bundle: 610.31 kB JS minified, 158.77 kB gzip. Vite reports the expected >500 kB chunk warning. Existing workspace builds also emit browser externalization warnings for backend filesystem utilities; the new demo browser console has no error/warning entries.
- New tests cover contact range, damage, parry vs held guard, finite rounds, real Ignition learning/evaluation, distinct ready/windup observations and terminal timed rounds.

## Browser evidence

On the local in-app browser at http://127.0.0.1:3033/:

- Arena, articulated armour, inspection camera and combat controls visually inspected.
- Desktop 1440 × 900 and mobile viewport 390 × 844: no horizontal document overflow. Mobile controls visible. This is responsive emulation, not physical mobile GPU testing.
- Keyboard Space and mobile Frapper each visibly reduce stamina from 100 to 76 after starting a duel.
- Pause/resume and Escape tested; game surface retains focus after controls and after switching to the learned opponent.
- An idle player loses and receives a defeat overlay; replay starts a fresh round.
- Training stop reports interruption and returns controls to an enabled state.
- Two completed 60,000-transition runs with corrected observation bins: 0/10 wins before training; 7/10 and 10/10 afterwards. Outcomes vary with unseeded exploration. Ten held-out reference-controller seeds are used; this measures a narrow same-environment opponent, not human-level combat.
- The learned option is selectable, its label identifies a frozen policy, and a player attack works after selection.
- Final browser log inspection: no warning/error entries, only Vite lifecycle messages.

## Standards review

Independent reviewer checked the scoped changes against applicable conventions. Fixed malformed learned-option markup, keyboard focus after controls and opponent selection, and automatic spectator restart overriding pause. Final targeted review: no outstanding findings.

## Spec review

Independent reviewer checked the implementation against README scope. Fixed aliased state bins, timed-round terminal semantics, learned opponent availability and retraining replacing an active round's policy. A round now captures its agent at reset. Final targeted review: no remaining concrete blockers.

## Limits

This is a first playable stylized slice. Combat uses one attack, guard/parry and seven discrete actions. It does not implement For Honor's three-direction combat, self-play or multiplayer. Characters are built directly with Three.js; no Blender production pipeline or purchased model is implied. Policy is held in browser memory only. Visual appeal and combat feel still require human judgement; automated checks do not establish audience reach or AAA quality.
