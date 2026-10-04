# Genuine focus-loss and held command clearing

Chromium 145 with Xvfb display :91, software ANGLE/SwiftShader rendering and DevTools port9228; browser driven only through dev-browser CLI. Disable Emulation.setFocusEmulationEnabled on both CDP page sessions so browser tab focus is observable. This is runtime configuration, not a product input or policy hook.

Switching to a second tab emits trusted blur, document.hasFocus becomes false and Session en pause is shown. With ArrowUp held, switch tab, wait for the paused HUD to settle, return and resume using the actual button without releasing ArrowUp. Speed falls from50 to39 km/h over4 seconds. Only then release the key and press Escape. The public HUD demonstrates the held acceleration was cleared. Raw result in coast.json; rendered pause screenshot shown inline and visually inspected.

Earlier headless attempts were inconclusive because both pages reported focus. An initial headed run lacked working rendering and showed speed0; it was not accepted as held-command proof. The first rendered run sampled HUD before it settled and was superseded by this paused-HUD measurement. No fake blur event, private state injection or vehicle reset is used.

This proves focus-loss pause and held-command clearing on this identified runtime. It does not prove a full player race or60 FPS performance.
