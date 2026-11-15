import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Box3, Group, Matrix4, Mesh, Triangle, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { expect, test } from 'vitest';
import { HangarStatus } from '../Scene';
import { createHangarLoad } from './hangarLifecycle';
import type { AssetStatus } from './useGLB';
import { readModelBytes } from './visualTestIo';

async function load(name = 'hangar-orbital') {
  const bytes = readModelBytes(name);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  return { bytes, ...gltf };
}

test('frozen GLB hash, bounds, geometry and four-asset totals are current', async () => {
  const hangar = await load();
  expect(createHash('sha256').update(hangar.bytes).digest('hex')).toBe('c004741dffc17a18f9d66d04b21e7a28001a693a689ca872f54114c7aa58b8ee');
  expect(hangar.bytes.length).toBe(1911040);
  expect(hangar.animations).toHaveLength(0);
  const bounds = new Box3().setFromObject(hangar.scene);
  bounds.min.toArray().forEach((v, i) => expect(v).toBeCloseTo([-18.025, -3.705, -40.0466][i], 4));
  bounds.max.toArray().forEach((v, i) => expect(v).toBeCloseTo([17.660225, 14.869, 9.6][i], 4));
  let bytes = 0, triangles = 0, meshes = 0;
  for (const name of ['hangar-orbital', 'drone-remorqueur', 'cargo-orbitale', 'poste-arrimage']) {
    const asset = name === 'hangar-orbital' ? hangar : await load(name);
    bytes += asset.bytes.length;
    let assetTriangles = 0, assetMeshes = 0;
    asset.scene.traverse(o => {
      if (!(o instanceof Mesh)) return;
      assetMeshes++;
      assetTriangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    });
    if (name === 'hangar-orbital') expect([assetTriangles, assetMeshes]).toEqual([26430, 10]);
    triangles += assetTriangles; meshes += assetMeshes;
  }
  expect([bytes, triangles, meshes]).toEqual([4792364, 66198, 49]);
});

test('authored triangles leave the nominal cargo/drone straight approach corridor clear', async () => {
  const { scene } = await load();
  scene.updateMatrixWorld(true);
  // Nominal travel from cargo start through drone success pose; no claim for arbitrary manoeuvres.
  const corridor = new Box3(new Vector3(-8.01, -.6, -.8), new Vector3(9.11, .6, .8));
  const triangle = new Triangle();
  let intersections = 0;
  scene.traverse(o => {
    if (!(o instanceof Mesh)) return;
    const position = o.geometry.attributes.position, index = o.geometry.index;
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      [triangle.a, triangle.b, triangle.c].forEach((v, j) => v.fromBufferAttribute(position, index ? index.getX(i + j) : i + j).applyMatrix4(o.matrixWorld));
      if (corridor.intersectsTriangle(triangle)) intersections++;
    }
  });
  expect(intersections).toBe(0);
});

for (const compact of [false, true]) {
  test(`static identity, shadow policy and owned disposal, compact=${compact}`, async () => {
    const { scene } = await load();
    const parent = new Group(), statuses: AssetStatus[] = [];
    const owner = createHangarLoad(parent, compact, s => statuses.push(s));
    const transforms = new Map<string, number[]>();
    scene.traverse(o => { o.updateMatrix(); transforms.set(o.uuid, o.matrix.toArray()); });
    owner.loaded(scene);
    expect(parent.children).toEqual([scene]);
    expect(parent.matrix.equals(new Matrix4())).toBe(true);
    expect(scene.matrix.equals(new Matrix4())).toBe(true);
    let geometriesDisposed = 0, materialsDisposed = 0;
    const geometries = new Set(), materials = new Set();
    scene.traverse(o => {
      expect(o.matrix.toArray()).toEqual(transforms.get(o.uuid));
      if (!(o instanceof Mesh)) return;
      expect(o.castShadow).toBe(!compact); expect(o.receiveShadow).toBe(true);
      expect(o.renderOrder).toBe(0);
      geometries.add(o.geometry);
      o.geometry.addEventListener('dispose', () => { geometriesDisposed++; });
      for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
        expect(material.depthTest).toBe(true);
        materials.add(material);
        material.addEventListener('dispose', () => { materialsDisposed++; });
      }
    });
    owner.close(); owner.close(); owner.failed();
    expect(parent.children).toHaveLength(0);
    expect(geometriesDisposed).toBe(geometries.size);
    expect(materialsDisposed).toBe(materials.size);
    expect(statuses).toEqual(['loading', 'ready']);
  });
}

test('failure, close, late real GLB disposal and remount have independent statuses', async () => {
  const parent = new Group(), statuses: AssetStatus[] = [];
  const owner = createHangarLoad(parent, false, s => statuses.push(s));
  owner.failed(); owner.close(); owner.failed();
  const { scene } = await load();
  let disposed = 0;
  scene.traverse(o => { if (o instanceof Mesh) o.geometry.addEventListener('dispose', () => { disposed++; }); });
  owner.loaded(scene);
  expect(disposed).toBe(10);
  expect(parent.children).toHaveLength(0);
  expect(statuses).toEqual(['loading', 'NONFINAL']);
  const next = createHangarLoad(parent, true, s => statuses.push(s));
  next.loaded((await load()).scene);
  expect(parent.children).toHaveLength(1);
  expect(statuses).toEqual(['loading', 'NONFINAL', 'loading', 'ready']);
  next.close(); expect(parent.children).toHaveLength(0);
});

test('real DOM status is independent and suppressed for all unavailable graphics states', () => {
  for (const status of ['loading', 'ready', 'NONFINAL'] as const) {
    for (const graphics of ['checking', 'failed', 'lost'] as const) {
      expect(renderToStaticMarkup(createElement(HangarStatus, { graphics, status }))).toBe('');
    }
  }
  const html = (status: AssetStatus) => renderToStaticMarkup(createElement(HangarStatus, { graphics: 'available', status }));
  expect(html('loading')).toContain('Chargement du hangar');
  expect(html('loading')).not.toContain('Hangar chargé');
  expect(html('ready')).toContain('Hangar chargé');
  expect(html('NONFINAL')).toContain('role="alert"');
  expect(html('NONFINAL')).toContain('NONFINAL');
  expect(html('NONFINAL')).not.toContain('Hangar chargé');
});
