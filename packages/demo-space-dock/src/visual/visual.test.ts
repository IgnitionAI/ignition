import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { AnimationClip, Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, NumberKeyframeTrack, Texture, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { adaptModel, ENVELOPES } from './modelConfig';
import { createClipPlayer, createLoadSlot, ownModel } from './modelLifecycle';
import { ContactSignal, initialSignals, nozzleActive, updateMaterials } from './signals';
async function load(name: string) {
  const data = readFileSync(`packages/demo-space-dock/public/models/${name}.glb`);
  return new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
}
describe('visual contract on actual Three objects', () => {
  test('all eight actions map to independent nozzle groups; brake has its own generic beacon', () => {
    for (let action = 0; action < 8; action++) {
      expect(nozzleActive('ThrusterCore_L_F', action)).toBe(action === 1);
      expect(nozzleActive('RetroCore_R', action)).toBe(action === 2);
      expect(nozzleActive('LateralCore_R', action)).toBe(action === 3);
      expect(nozzleActive('LateralCore_L', action)).toBe(action === 4);
    }
  });
  test('actual GLBs fit three axes with centered body pivots and correct forward rotation', async () => {
    for (const [kind, name] of [['drone', 'drone-remorqueur'], ['cargo', 'cargo-orbitale']] as const) {
      const asset = await load(name), adapted = adaptModel(asset.scene, kind);
      adapted.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(adapted), size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3());
      size.toArray().forEach((value, index) => expect(value).toBeCloseTo(ENVELOPES[kind][index] * (kind === 'drone' ? .98 : 1), 6));
      expect(center.length()).toBeLessThan(1e-6);
      if (kind === 'drone') {
        const forward = new Vector3(0, 0, -1).transformDirection(adapted.children[0].matrixWorld);
        expect(forward.x).toBeCloseTo(1); expect(forward.z).toBeCloseTo(0);
      }
      console.log('adapted bounds', kind, bounds.min.toArray(), bounds.max.toArray());
      ownModel(asset.scene)();
    }
    const asset = await load('poste-arrimage'), dock = adaptModel(asset.scene, 'dock');
    dock.position.set(6, -.65, 0); dock.updateMatrixWorld(true);
    expect(dock.children[0].localToWorld(new Vector3(0, 0, 0)).toArray()).toEqual([6, -.65, 0]);
    expect(dock.children[0].localToWorld(new Vector3(0, 0, -4.5)).x).toBeCloseTo(10.5);
    ownModel(asset.scene)();
  });
  test('drone envelope stays bounded through ClampClose and physical yaw rotates render geometry', async () => {
    const asset = await load('drone-remorqueur'), adapted = adaptModel(asset.scene, 'drone');
    const player = createClipPlayer(asset.scene, asset.animations, 'ClampClose');
    const pivots = ['ClampPivot_L', 'ClampPivot_R'].map(name => asset.scene.getObjectByName(name)!);
    const expectClamp = (angle: number) => {
      expect(pivots[0].rotation.y).toBeCloseTo(angle, 6);
      expect(pivots[1].rotation.y).toBeCloseTo(-angle, 6);
    };
    player.sync(1, true, false);
    expectClamp(.38);
    for (let index = 0; index <= 20; index++) {
      adapted.updateMatrixWorld(true);
      const box = new Box3().setFromObject(adapted), size = box.getSize(new Vector3());
      size.toArray().forEach((value, axis) => expect(value).toBeLessThanOrEqual(ENVELOPES.drone[axis] + 1e-6));
      box.min.toArray().forEach((value, axis) => expect(value).toBeGreaterThanOrEqual(-ENVELOPES.drone[axis] / 2 - 1e-6));
      box.max.toArray().forEach((value, axis) => expect(value).toBeLessThanOrEqual(ENVELOPES.drone[axis] / 2 + 1e-6));
      player.update(.05);
    }
    expectClamp(0);
    player.sync(2, true, false); expectClamp(.38);
    player.update(.05); expect(pivots[0].rotation.y).toBeGreaterThan(0); expect(pivots[0].rotation.y).toBeLessThan(.38);
    player.sync(2, true, true); expectClamp(0);
    player.update(1); expectClamp(0);
    player.sync(3, true, true); expectClamp(0);
    player.dispose(); adapted.rotation.y = Math.PI / 2; adapted.updateMatrixWorld(true);
    const size = new Box3().setFromObject(adapted).getSize(new Vector3());
    expect(size.x).toBeCloseTo(1.2 * .98); expect(size.y).toBeCloseTo(.8 * .98); expect(size.z).toBeCloseTo(1.6 * .98);
    ownModel(asset.scene)();
  });
  test('inactive clip holds its first key, success/reduced motion shows final pose, dispose restores rest', () => {
    const root = new Group(), pivot = new Group(); pivot.name = 'pivot'; root.add(pivot);
    const clip = new AnimationClip('DockLock', 1, [new NumberKeyframeTrack('pivot.rotation[z]', [0, 1], [0, 1])]);
    const player = createClipPlayer(root, [clip], 'DockLock');
    player.sync(1, false, false); player.update(1); expect(pivot.rotation.z).toBe(0);
    player.sync(1, true, true); expect(pivot.rotation.z).toBeCloseTo(1);
    player.sync(2, false, true); expect(pivot.rotation.z).toBe(0);
    player.sync(2, true, false); player.update(.05); expect(pivot.rotation.z).toBeCloseTo(.05);
    player.dispose(); expect(pivot.rotation.z).toBe(0);
  });
  test('real DockLock holds open before success, closes without an opening jump and reopens on generation reset', async () => {
    const asset = await load('poste-arrimage');
    const clip = asset.animations.find(item => item.name === 'DockLock')!;
    const pivots = ['DockClampPivot_L', 'DockClampPivot_R'].map(name => {
      const pivot = asset.scene.getObjectByName(name)!;
      const track = clip.tracks.find(item => item.name === `${name}.quaternion`)!;
      return { pivot, rest: pivot.quaternion.clone(), first: Array.from(track.values).slice(0, 4), final: Array.from(track.values).slice(-4) };
    });
    const expectKey = (key: 'first' | 'final') => {
      for (const item of pivots) item.pivot.quaternion.toArray().forEach((value, index) => expect(value).toBeCloseTo(item[key][index], 6));
    };
    // The real asset's exported rest is closed; the first animation key is open.
    for (const item of pivots) {
      expect(item.rest.toArray()).toEqual([0, 0, 0, 1]);
      expect(Math.abs(item.first[1])).toBeCloseTo(Math.sin(.42 / 2), 6);
      item.final.forEach((value, index) => expect(value).toBeCloseTo([0, 0, 0, 1][index], 6));
    }
    const player = createClipPlayer(asset.scene, asset.animations, 'DockLock');
    player.sync(1, false, false); expectKey('first');
    for (let frame = 0; frame < 30; frame++) {
      player.sync(1, false, false); player.update(.05); expectKey('first');
    }
    const beforeSuccess = pivots.map(item => item.pivot.quaternion.toArray());
    player.sync(1, true, false); expectKey('first');
    pivots.forEach((item, index) => expect(item.pivot.quaternion.toArray()).toEqual(beforeSuccess[index]));
    player.update(.05);
    for (const item of pivots) {
      const angle = Math.abs(2 * Math.atan2(item.pivot.quaternion.y, item.pivot.quaternion.w));
      expect(angle).toBeGreaterThan(0); expect(angle).toBeLessThan(.42);
    }
    for (let frame = 0; frame < 30; frame++) { player.sync(1, true, false); player.update(.05); }
    expectKey('final');
    player.sync(2, false, false); expectKey('first');
    player.update(.05); expectKey('first');
    player.sync(3, false, true); expectKey('first');
    player.update(1); expectKey('first');
    player.sync(3, true, true); expectKey('final');
    player.update(1); expectKey('final');
    player.sync(4, false, true); expectKey('first');
    player.dispose();
    for (const item of pivots) expect(item.pivot.quaternion.toArray()).toEqual(item.rest.toArray());
    ownModel(asset.scene)();

    // Reduced motion must also initialize open on a newly loaded, closed GLB.
    const reducedAsset = await load('poste-arrimage');
    const reducedPlayer = createClipPlayer(reducedAsset.scene, reducedAsset.animations, 'DockLock');
    const reducedPivot = reducedAsset.scene.getObjectByName('DockClampPivot_L')!;
    reducedPlayer.sync(1, false, true);
    expect(reducedPivot.rotation.y).toBeCloseTo(.42, 6);
    reducedPlayer.update(1); expect(reducedPivot.rotation.y).toBeCloseTo(.42, 6);
    reducedPlayer.sync(1, true, true); expect(reducedPivot.rotation.y).toBeCloseTo(0, 6);
    reducedPlayer.dispose(); ownModel(reducedAsset.scene)();
  });
  test('resource ownership releases originals, isolated clones and shared texture/geometry exactly once, after detach', () => {
    const parent = new Group(), root = new Group(), geometry = new BoxGeometry(), texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture });
    root.add(new Mesh(geometry, material), new Mesh(geometry, material)); parent.add(root);
    const events: string[] = [];
    geometry.addEventListener('dispose', () => { expect(root.parent).toBeNull(); events.push('geometry'); });
    material.addEventListener('dispose', () => events.push('original'));
    texture.addEventListener('dispose', () => events.push('texture'));
    const dispose = ownModel(root);
    root.children.forEach((object, index) => {
      const clone = (object as Mesh).material as MeshStandardMaterial;
      expect(clone).not.toBe(material); expect(clone.map).toBe(texture);
      clone.addEventListener('dispose', () => events.push(`clone${index}`));
    });
    dispose(); dispose(); expect(events.sort()).toEqual(['clone0', 'clone1', 'geometry', 'original', 'texture']);
  });
  test('late response disposes actual resources without preparation or attachment; swap detaches first', () => {
    const parent = new Group(), slot = createLoadSlot(parent); slot.close();
    const root = new Group(), geometry = new BoxGeometry(); root.add(new Mesh(geometry, new MeshStandardMaterial()));
    let disposed = false, prepared = false;
    geometry.addEventListener('dispose', () => { disposed = true; });
    expect(slot.accept(root, () => { prepared = true; return { object: root, cleanup() {} }; })).toBe(false);
    expect(disposed).toBe(true); expect(prepared).toBe(false); expect(parent.children).toHaveLength(0);
    const live = createLoadSlot(parent), first = new Group(), second = new Group();
    let cleanups = 0;
    live.accept(first, () => ({ object: first, cleanup() { expect(first.parent).toBeNull(); cleanups++; } }));
    live.accept(second, () => ({ object: second, cleanup() { cleanups++; } }));
    expect(parent.children).toEqual([second]); live.close(); live.close(); expect(cleanups).toBe(2);
  });
  test('generation clears contact energy; reduced motion reflects materials and success turns thrust off', () => {
    const contact = new ContactSignal(), state = initialSignals(); state.generation = 1;
    expect(contact.update(state, 0, false)).toBe(0); state.contacts = 1;
    expect(contact.update(state, 0, false)).toBe(9); state.generation = 2; state.contacts = 0;
    expect(contact.update(state, 0, false)).toBe(0);
    const root = new Group(), material = new MeshStandardMaterial(), nozzle = new Mesh(new BoxGeometry(), material);
    nozzle.name = 'ThrusterCore_L_F'; root.add(nozzle); state.action = 1;
    updateMaterials(root, state, 'drone', true, 0); expect(material.emissiveIntensity).toBe(4.5);
    state.outcome = 'success'; updateMaterials(root, state, 'drone', true, 0); expect(material.emissiveIntensity).toBe(.25);
    ownModel(root)();
  });
});
