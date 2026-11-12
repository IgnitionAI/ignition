import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import Scene from '../Scene';
import type { SceneProps } from '../simulation-contract';
import { readFileSync, writeFileSync } from 'node:fs';
import { Box3, Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { adaptModel } from './modelConfig';
import { cameraFrame } from './mobileCamera';

// Exercise Scene's emitted layout, not source text. Node has no layout engine:
// this bounded flex calculation covers a definite-height column with two items,
// a zero-min-height surface and an intrinsic, non-shrinking summary. Browser
// sizing, scroll, focus and native disclosure activation still need a real UA.
function styles(compact: boolean) {
  const html = renderToStaticMarkup(createElement(Scene, {
    env: {} as SceneProps['env'], compact, reducedMotion: true,
  }));
  const match = html.match(/<section[^>]*style="([^"]*)"><div style="([^"]*)"/);
  if (!match) throw new Error('Scene section and render surface missing');
  const parse = (css: string) => Object.fromEntries(css.split(';').filter(Boolean).map(rule => {
    const colon = rule.indexOf(':');
    return [rule.slice(0, colon), rule.slice(colon + 1)];
  }));
  return { section: parse(match[1]), surface: parse(match[2]), html };
}

function sceneRenderArea(width: number, height: number, summaryHeight: number, compact = true) {
  const { section, surface } = styles(compact);
  const length = (value: string | undefined): number => {
    if (value === '100%') return height;
    const calc = value?.match(/^calc\(100% - (\d+)px\)$/);
    if (calc) return height - Number(calc[1]);
    if (value && /^\d+(px)?$/.test(value)) return Number(value.replace('px', ''));
    throw new Error(`Unsupported layout length: ${value}`);
  };
  if (section.display === 'block') return { width, height: length(surface.height) };
  const flex = surface.flex.match(/^(\d+) (\d+) (.+)$/);
  if (!flex) throw new Error(`Unsupported flex: ${surface.flex}`);
  const basis = length(flex[3]);
  const remaining = height - basis - summaryHeight;
  return { width, height: Math.max(0, basis + (remaining >= 0 ? Number(flex[1]) : Number(flex[2])) * remaining) };
}

test('opening compact native details keeps the closed render area; extra text uses section scroll', () => {
  // Same viewport and state; intrinsic summary heights from the V1 292→214 case.
  const closed = sceneRenderArea(364, 320, 28);
  const open = sceneRenderArea(364, 320, 106);
  expect(closed).toEqual({ width: 364, height: 292 });
  expect(open).toEqual(closed);
  expect(sceneRenderArea(364, 320, 240)).toEqual(closed);
  expect(styles(true).section['overflow-y']).toBe('auto');
});

test('Scene sizing follows viewport resize and orientation; accepted desktop styles stay exact', () => {
  for (const [width, height, renderHeight] of [[364, 620, 592], [740, 320, 292], [480, 460, 432]]) {
    expect(sceneRenderArea(width, height, 28)).toEqual({ width, height: renderHeight });
    expect(sceneRenderArea(width, height, 106)).toEqual({ width, height: renderHeight });
  }
  const desktop = styles(false);
  expect(desktop.section).toEqual({ position: 'relative', display: 'block', 'flex-direction': 'column', width: '100%', height: '100%', 'min-height': '460px' });
  expect(desktop.surface).toEqual({ position: 'relative', flex: '1 1 0', 'min-height': '0', height: '100%' });
  expect(sceneRenderArea(1188, 550, 106, false)).toEqual({ width: 1188, height: 550 });
});

test('same-state open and closed areas preserve actual Three projections of GLBs and colliders across resize', async () => {
  const models = {} as Record<'cargo' | 'drone' | 'dock', Box3>;
  for (const [kind, name] of [['cargo', 'cargo-orbitale'], ['drone', 'drone-remorqueur'], ['dock', 'poste-arrimage']] as const) {
    const bytes = readFileSync(`packages/demo-space-dock/public/models/${name}.glb`);
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    models[kind] = new Box3().setFromObject(adaptModel(gltf.scene, kind));
  }
  const measurements = [];
  // Pose fixtures, not physics replay or a native resize event. Existing camera
  // coverage also sweeps animation envelopes and additional contact poses.
  for (const [name, cargoX] of [['depart', -7], ['trajet', 0], ['succes', 6]] as const) {
    const c = { x: cargoX, y: 0, z: 0 }, d = { x: cargoX + 2.3, y: 0, z: 0 }, goal = { x: 6, y: 0, z: 0 };
    let previousPosition: number[] | undefined;
    for (const [width, height] of [[364, 320], [364, 620], [740, 320]]) {
      const areas = [28, 106].map(summary => sceneRenderArea(width, height, summary));
      const frames = areas.map(area => cameraFrame(c, d, goal, area.width, area.height, true));
      expect(frames[1].position.toArray()).toEqual(frames[0].position.toArray());
      expect(frames[1].target.toArray()).toEqual(frames[0].target.toArray());
      if (previousPosition) expect(frames[0].position.toArray()).not.toEqual(previousPosition);
      previousPosition = frames[0].position.toArray();
      const projected = areas.map((area, index) => {
        const frame = frames[index];
        const camera = new PerspectiveCamera(frame.fov, area.width / area.height, .1, 160);
        camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld(true);
        return (['cargo', 'drone', 'dock'] as const).map(kind => {
          const offset = new Vector3(kind === 'cargo' ? c.x : kind === 'drone' ? d.x : goal.x, kind === 'dock' ? -.65 : 0, 0);
          const box = models[kind].clone();
          if (kind !== 'dock') {
            const half = new Vector3(...(kind === 'cargo' ? [1, .6, .8] : [.8, .4, .6]));
            box.union(new Box3(half.clone().negate(), half));
          }
          const corners = [box.min.x, box.max.x].flatMap(x => [box.min.y, box.max.y].flatMap(y => [box.min.z, box.max.z].map(z => new Vector3(x, y, z))));
          const points = (kind === 'dock' ? [0] : [0, Math.PI / 4, Math.PI / 2]).flatMap(yaw => corners.map(point => point.clone().applyMatrix4(new Matrix4().makeRotationY(yaw)).add(offset).project(camera)));
          for (const point of points) {
            expect(Math.abs(point.x)).toBeLessThanOrEqual(.9);
            expect(Math.abs(point.y)).toBeLessThanOrEqual(.9);
            expect(point.z).toBeGreaterThan(-1); expect(point.z).toBeLessThan(1);
          }
          return { kind, points: points.map(point => point.toArray()), pixelWidth: (Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))) * area.width / 2,
            pixelHeight: (Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))) * area.height / 2 };
        });
      });
      expect(projected[1]).toEqual(projected[0]);
      measurements.push({ fixture: name, viewport: [width, height], closed: areas[0], open: areas[1], position: frames[0].position.toArray(), projected });
    }
  }
  writeFileSync('packages/demo-space-dock/proofs/summary-v2/layout-projections.json', JSON.stringify({ layer: 'Node SSR bounded flex calculation + Three; no browser layout or physics replay', measurements }, null, 2) + '\n');
});
