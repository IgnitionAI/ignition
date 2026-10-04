# Complete player-versus-trained-driver browser recipe

Analysis: #17 requires an actual complete player race through the public keyboard controls, against a real trained checkpoint. API races and AI-only finishes do not establish this. The rendered minimap exposes the same route and car dots visible to a player, and the HUD exposes speed/laps/penalties.

Plan: select player mode, one bundled-29 opponent and licensed distinct car appearances through garage. Use dev-browser keyboard events exclusively for acceleration/brake/turn/pause. Navigation may read visible SVG polyline/dot geometry and HUD text to choose keyboard actions; no React internals, private world/agent state, injected policies, simulation time changes, resets or result manipulation. This is automated keyboard-player verification, not a claim that a person manually drove it.

Keep navigation state and raw observations in browser-tool tmp between short control segments. Pause and release keys at segment boundaries using normal controls, so a tool boundary never leaves acceleration active. Retain all penalties, rescues and failures. Do not restart just because a segment expires; inspect current retained page and recover visibly when tooling fails.

Acceptance: actual player completes3 ordered laps while real bundled checkpoint competes; final result identifies both and preserves outcomes. Public keyboard/pause/HUD behavior and geometry remain intact. Separately exercise asset/checkpoint errors, reload/replay and measure identified rendering runtime before claiming all #17 criteria. No API-only surrogate finish, ghost-mode shortcut or rule fallback inside the demo.
