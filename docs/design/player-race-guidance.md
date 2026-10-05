# Readable player race guidance — #17

Analysis: the real keyboard attempt reveals ambiguous minimap guidance: circular vehicle dots have no heading, and the next mandatory ordered gate is invisible. A player returning from off-road/rescue cannot identify the required pass on the map. Position/lap text alone does not communicate these two actionable facts.

Plan: preserve all simulation, learned policies, collision rules, ordered gates and saved contracts. Render a directional arrow on every existing car dot and an outlined marker for the focused car's next gate; add localized next-pass text to the existing race HUD. Reuse current map palette/layout. These are ordinary visible product information, not private data attributes, test exports, simulation hooks or input overrides. A finished result must not show an outstanding next gate.

Acceptance: actual map shows car headings and next-pass target, target/text track the selected competitor and disappear after finish. French/English HUD uses the same gate index as the actual simulation. Existing owner tests/types/build remain green; visually inspect the built scene. Browser navigation continues to send actual keyboard inputs based on visible geometry, including the new arrow, rather than reading React/agent internals. Preserve the original attempt and its penalties separately; a later completed player recipe must still prove all three ordered laps.

Out of scope: new physics, relaxed gate validation, marker-only screenshots as proof of racing, policy injection, time changes, teleportation or fabricated results.
