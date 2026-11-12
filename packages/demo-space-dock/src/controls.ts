import type { DockRuntime } from './runtime';
import type { Action } from './simulation-contract';
export const KEY_ACTIONS: Readonly<Record<string, Action>> = Object.freeze({
  KeyX: 0, KeyW: 1, ArrowUp: 1, KeyS: 2, ArrowDown: 2, KeyA: 3, ArrowLeft: 3,
  KeyD: 4, ArrowRight: 4, KeyQ: 5, KeyE: 6, Space: 7,
});
export function attachControls(runtime: DockRuntime, host: Window, page: Document, publish: () => void): () => void {
  const down = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY/.test(event.target.tagName)) return;
    if (event.code === 'KeyP' && !event.repeat) { runtime.setPaused(!runtime.isPaused); publish(); }
    if (event.code === 'KeyR' && !event.repeat) { runtime.reset(); publish(); }
    const action = KEY_ACTIONS[event.code];
    if (action === undefined) return;
    event.preventDefault(); runtime.press(event.code, action);
  };
  const up = (event: KeyboardEvent) => runtime.release(event.code);
  const blur = () => { runtime.setPaused(true); publish(); };
  const visibility = () => { if (page.hidden) blur(); };
  host.addEventListener('keydown', down); host.addEventListener('keyup', up);
  host.addEventListener('blur', blur); page.addEventListener('visibilitychange', visibility);
  return () => {
    runtime.clearControls(); host.removeEventListener('keydown', down); host.removeEventListener('keyup', up);
    host.removeEventListener('blur', blur); page.removeEventListener('visibilitychange', visibility);
  };
}
