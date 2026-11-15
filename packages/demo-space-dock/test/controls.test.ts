import { expect, it, vi } from 'vitest';
import { SpaceDockEnv } from '../src/space-dock-env';
import { DockRuntime } from '../src/runtime';
import { attachControls } from '../src/controls';
function key(type: string, code: string) { const event = new Event(type, { cancelable: true }); Object.assign(event, { code, repeat: false }); return event; }
// Node has no DOM tree: inject only HTMLElement/tagName and the event target.
// EventTarget dispatch, attachControls, DockRuntime and Rapier remain real.
async function withTarget(tagName: string, check: (host: EventTarget, target: EventTarget, runtime: DockRuntime) => void) {
  class LocalHTMLElement extends EventTarget { constructor(readonly tagName: string) { super(); } }
  vi.stubGlobal('HTMLElement', LocalHTMLElement);
  const runtime = new DockRuntime(await SpaceDockEnv.create(42));
  const host = new EventTarget(), page = Object.assign(new EventTarget(), { hidden: false });
  const detach = attachControls(runtime, host as unknown as Window, page as unknown as Document, () => {});
  try { check(host, new LocalHTMLElement(tagName), runtime); }
  finally { detach(); runtime.dispose(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
}
function targetedKey(type: string, code: string, target: EventTarget) {
  const event = key(type, code);
  Object.defineProperty(event, 'target', { value: target });
  return event;
}
it('leaves Space on SUMMARY to the native control without pressing the brake', async () => {
  await withTarget('SUMMARY', (host, target, runtime) => {
    const press = vi.spyOn(runtime, 'press'); // Call through to the real runtime.
    const event = targetedKey('keydown', 'Space', target);
    host.dispatchEvent(event); runtime.advance(0.1);
    expect.soft(event.defaultPrevented).toBe(false);
    expect.soft(press).not.toHaveBeenCalled();
    expect.soft(runtime.env.telemetry.action).toBe(0);
  });
});
it('keeps Space braking on the scene and releases it on keyup from SUMMARY', async () => {
  await withTarget('CANVAS', (host, target, runtime) => {
    const event = targetedKey('keydown', 'Space', target);
    host.dispatchEvent(event); runtime.advance(0.1);
    expect(event.defaultPrevented).toBe(true); expect(runtime.env.telemetry.action).toBe(7);
    // keyup must release even when its target has become a native control.
    const summary = Object.assign(new HTMLElement(), { tagName: 'SUMMARY' });
    host.dispatchEvent(targetedKey('keyup', 'Space', summary)); runtime.advance(0.1);
    expect(runtime.env.telemetry.action).toBe(0);
  });
});
it.each(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'])('keeps the existing %s keyboard guard', async tagName => {
  await withTarget(tagName, (host, target, runtime) => {
    const press = vi.spyOn(runtime, 'press');
    for (const code of ['Space', 'KeyW', 'KeyP', 'KeyR']) {
      const event = targetedKey('keydown', code, target);
      host.dispatchEvent(event); runtime.advance(0.1);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(press).not.toHaveBeenCalled(); expect(runtime.env.telemetry.action).toBe(0);
    expect(runtime.isPaused).toBe(false); expect(runtime.history).toHaveLength(4);
  });
});
it.each(['Enter', 'Tab'])('leaves %s on SUMMARY uncaptured', async code => {
  await withTarget('SUMMARY', (host, target, runtime) => {
    const press = vi.spyOn(runtime, 'press');
    const event = targetedKey('keydown', code, target);
    host.dispatchEvent(event); runtime.advance(0.1);
    expect(event.defaultPrevented).toBe(false); expect(press).not.toHaveBeenCalled();
    expect(runtime.env.telemetry.action).toBe(0);
  });
});
it('clears on blur/visibility and detaches every listener over repeated lifecycles', async () => {
  vi.stubGlobal('HTMLElement', class {});
  const host = new EventTarget(), page = Object.assign(new EventTarget(), { hidden: false });
  try {
    for (let mount = 0; mount < 5; mount++) {
      const env = await SpaceDockEnv.create(mount), runtime = new DockRuntime(env); let published = 0;
      const detach = attachControls(runtime, host as unknown as Window, page as unknown as Document, () => published++);
      host.dispatchEvent(key('keydown', 'KeyW')); runtime.advance(0.1); expect(env.telemetry.action).toBe(1);
      host.dispatchEvent(new Event('blur')); expect(runtime.isPaused).toBe(true);
      runtime.setPaused(false); runtime.advance(0.1); expect(env.telemetry.action).toBe(0);
      host.dispatchEvent(key('keydown', 'Space')); page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
      expect(runtime.isPaused).toBe(true); expect(published).toBe(2); page.hidden = false;
      detach(); runtime.setPaused(false); host.dispatchEvent(new Event('blur'));
      host.dispatchEvent(key('keydown', 'KeyW')); runtime.advance(0.1);
      expect(runtime.isPaused).toBe(false); expect(env.telemetry.action).toBe(0); expect(published).toBe(2);
      runtime.dispose();
    }
  } finally { vi.unstubAllGlobals(); }
});
