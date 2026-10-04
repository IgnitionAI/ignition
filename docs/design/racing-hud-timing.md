# Elapsed-time race HUD refresh — #17

Analysis: live Chromium MutationObserver evidence records only2 visible HUD updates in11 animation frames over4.398s. Driver publishes stats every6 frames; its nominal10Hz rate at60FPS becomes roughly one update every2 seconds in this software-rendered session. Minimap, speed and next-pass information consequently lag the displayed 3D movement.

Plan: use elapsed frame time to cap stats publication at10Hz instead of counting frames. Preserve fixed-step accumulation, input mapping, loaded policies, geometry, camera math and always-running canvas lifecycle in this focused repair. Do not change simulation time to meet a rendering target.

Acceptance: source types/build and existing owner suites pass; real active browser race has substantially more public timer/map updates relative to rendered frames than the retained before result. Pause keeps race time stable; camera selection and resume remain functional; a genuine learned race still reaches its result. Keep results/FPS limits separate. Review source/spec and standards, then preserve direct Chromium evidence. No private test export or duplicated timer-unit test is needed for this low-impact renderer change; public MutationObserver measures actual visible updates.
