import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import Scene, { GraphicsSurface, SceneSummary } from '../Scene';
import { SpaceDockEnv } from '../space-dock-env';

test('compact summary is one native keyboard disclosure, with NONFINAL outside its closed content', () => {
  const html = renderToStaticMarkup(createElement(SceneSummary, {
    compact: true, summary: 'running · contacts 0 · action 0', graphics: 'available', hangarStatus: 'NONFINAL',
    statuses: { drone: 'NONFINAL', cargo: 'ready', dock: 'ready' },
  }));
  expect(html).toContain('<details'); expect(html).toContain('<summary');
  expect(html).not.toContain('<details open');
  expect(html).toContain('white-space:nowrap');
  expect(html.slice(html.indexOf('</details>'))).toContain('NONFINAL — hangar');
  expect(html.slice(html.indexOf('</details>'))).toContain('NONFINAL — GLB');
  expect(html).not.toContain('position:absolute');
});

test('real Scene reads reset telemetry immediately on render with no timer or old body handles', async () => {
  const env = await SpaceDockEnv.create(42);
  try {
    env.step(1);
    const render = () => renderToStaticMarkup(createElement(Scene, { env, compact: true, reducedMotion: true }));
    expect(render()).toContain('action 1');
    const generation = env.generation;
    env.reset(42);
    expect(env.generation).toBeGreaterThan(generation);
    expect(render()).toContain('running · contacts 0 · action 0');
    expect(render()).not.toContain('action 1');
  } finally { env.dispose(); }
});

test('WebGL errors remain outside disclosure and unavailable graphics never claim a loaded hangar', () => {
  for (const graphics of ['failed', 'lost'] as const) {
    const html = renderToStaticMarkup(createElement('section', null,
      createElement(GraphicsSurface, { state: graphics }),
      createElement(SceneSummary, { compact: true, summary: 'running · contacts 0 · action 0', graphics, hangarStatus: 'ready', statuses: { drone: 'ready', cargo: 'ready', dock: 'ready' } })));
    expect(html.indexOf('role="alert"')).toBeLessThan(html.indexOf('<details'));
    expect(html).toContain('WebGL'); expect(html).not.toContain('Hangar chargé');
  }
});
