import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import Scene from '../Scene';
import type { SceneProps } from '../simulation-contract';

test('initial DOM announces graphics verification without claiming ready or loading GLBs', () => {
  // SSR does not read physics: no simulation or rendering library is replaced.
  const html = renderToStaticMarkup(createElement(Scene, { env: {} as SceneProps['env'], compact: false, reducedMotion: false }));
  expect(html).toContain('Vérification du rendu WebGL');
  expect(html).not.toContain('Scène prête');
  expect(html).not.toContain('Chargement des modèles');
});

import { GraphicsSurface } from '../Scene';
import { createGraphicsLifecycle, getGraphicsContext, observeContextLoss } from './graphicsLifecycle';
import type { GraphicsState } from './graphicsLifecycle';

function surface(state: GraphicsState) {
  // These are actual React DOM elements; a failed owner must not render this subtree.
  return renderToStaticMarkup(createElement(GraphicsSurface, { state },
    createElement('canvas', null), createElement('p', { role: 'status' }, 'Chargement des modèles…')));
}

for (const refusal of ['null', 'throw'] as const) {
  test(`getContext ${refusal}: refusal stays latched across runtime/summary/layout/seed updates`, async () => {
    const transitions: GraphicsState[] = [];
    const owner = createGraphicsLifecycle(state => transitions.push(state));
    let probes = 0;
    // Canvas getContext is the browser boundary. No React, Three, physics or renderer is mocked.
    const canvas = { getContext() { probes++; if (refusal === 'throw') throw new Error('denied'); return null; } } as unknown as HTMLCanvasElement;
    let modelsMounted = false;
    const initialize = () => { getGraphicsContext(canvas); modelsMounted = true; };
    await owner.start(initialize);
    const boundedProbes = probes;
    for (let update = 0; update < 100; update++) {
      await owner.start(initialize);
      const html = surface(owner.state);
      expect(html).toContain('role="alert"');
      expect(html).toContain('WebGL indisponible');
      expect(html).not.toContain('<canvas');
      expect(html).not.toContain('Chargement des modèles');
    }
    expect(transitions).toEqual(['failed']);
    expect(modelsMounted).toBe(false);
    expect(probes).toBe(refusal === 'throw' ? 1 : 2);
    expect(probes).toBe(boundedProbes);
  });
}

test('available initialization runs once even while pending and retains the graphics subtree', async () => {
  let finish!: () => void;
  let initializations = 0;
  const transitions: GraphicsState[] = [];
  const owner = createGraphicsLifecycle(state => transitions.push(state));
  const initialize = () => { initializations++; return new Promise<void>(resolve => { finish = resolve; }); };
  const pending = owner.start(initialize);
  await Promise.resolve();
  const same = owner.start(initialize);
  expect(same).toBe(pending);
  expect(owner.state).toBe('checking');
  finish(); await pending;
  for (let update = 0; update < 100; update++) await owner.start(initialize);
  expect(initializations).toBe(1);
  expect(transitions).toEqual(['available']);
  expect(surface(owner.state)).toContain('<canvas');
});

test('async configure rejection is handled, latched and rendered outside any canvas', async () => {
  const owner = createGraphicsLifecycle(() => {});
  await expect(owner.start(() => Promise.reject(new Error('configure rejected')))).resolves.toBeUndefined();
  await owner.start(() => { throw new Error('must never retry'); });
  expect(owner.state).toBe('failed');
  expect(surface(owner.state)).not.toContain('<canvas');
  expect(surface(owner.state)).toContain('role="alert"');
});

test('real contextlost event removes graphics, keeps an external alert and detaches its listener', async () => {
  const target = new EventTarget();
  const transitions: GraphicsState[] = [];
  const owner = createGraphicsLifecycle(state => transitions.push(state));
  const detach = observeContextLoss(target, () => owner.fail('lost'));
  await owner.start(() => {});
  const event = new Event('webglcontextlost', { cancelable: true });
  target.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  for (let update = 0; update < 100; update++) await owner.start(() => { throw new Error('retry'); });
  expect(owner.state).toBe('lost');
  expect(transitions).toEqual(['available', 'lost']);
  const html = surface(owner.state);
  expect(html).toContain('Contexte WebGL perdu');
  expect(html).toContain('role="alert"');
  expect(html).not.toContain('<canvas');
  expect(html).not.toContain('Chargement des modèles');
  detach();
  const afterDetach = new Event('webglcontextlost', { cancelable: true });
  target.dispatchEvent(afterDetach);
  expect(afterDetach.defaultPrevented).toBe(false);
});

test('loss during pending initialization cannot transition back to available', async () => {
  const transitions: GraphicsState[] = [];
  const owner = createGraphicsLifecycle(state => transitions.push(state));
  let finish!: () => void;
  const pending = owner.start(() => new Promise<void>(resolve => { finish = resolve; }));
  await Promise.resolve(); owner.fail('lost'); finish(); await pending;
  expect(owner.state).toBe('lost');
  expect(transitions).toEqual(['lost']);
});
