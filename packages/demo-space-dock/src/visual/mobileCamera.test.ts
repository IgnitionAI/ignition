import { readFileSync, writeFileSync } from 'node:fs';
import { AnimationMixer, Box3, Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { expect, test } from 'vitest';
import { adaptModel } from './modelConfig';
import { cameraFrame } from './mobileCamera';

const poses = [
  { name: 'depart', cargo: [-7, 0, 0], drone: [-4.7, 0, 0] },
  { name: 'trajet', cargo: [0, 0, 0], drone: [2.3, 0, 0] },
  { name: 'succes', cargo: [6, 0, 0], drone: [8.3, 0, 0] },
  // Test fixture at dock-back inner face x=10.3; not a replay of physics.
  { name: 'contact-vue-approx-HUD', cargo: [6.46, 0, 0], drone: [8.76, 0, 0] },
  { name: 'contact-paroi', cargo: [7.2, 0, 0], drone: [9.5, 0, 0] },
];
const viewports = [[364, 320], [364, 292], [364, 160], [390, 600], [600, 320]];
const xyz = (p: number[]) => ({ x: p[0], y: p[1], z: p[2] });
function corners(box: Box3) {
  return [box.min.x, box.max.x].flatMap(x => [box.min.y, box.max.y].flatMap(y => [box.min.z, box.max.z].map(z => new Vector3(x, y, z))));
}
function project(points: Vector3[], camera: PerspectiveCamera, width: number, height: number) {
  const p = points.map(v => v.clone().project(camera));
  return { width: (Math.max(...p.map(v => v.x)) - Math.min(...p.map(v => v.x))) * width / 2,
    height: (Math.max(...p.map(v => v.y)) - Math.min(...p.map(v => v.y))) * height / 2, points: p.map(v => v.toArray()) };
}

test('compact frames actual adapted GLB and collider corners, goal, poses and viewport changes; desktop stays exact', async () => {
  const models = {} as Record<'cargo' | 'drone' | 'dock', Box3>;
  for (const [kind, name] of [['cargo', 'cargo-orbitale'], ['drone', 'drone-remorqueur'], ['dock', 'poste-arrimage']] as const) {
    const b = readFileSync(`packages/demo-space-dock/public/models/${name}.glb`);
    const gltf = await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
    const model = adaptModel(gltf.scene, kind);
    models[kind] = new Box3().setFromObject(model);
    const mixer = new AnimationMixer(gltf.scene);
    for (const clip of gltf.animations) {
      mixer.clipAction(clip).play();
      for (let i = 0; i <= 20; i++) { mixer.setTime(clip.duration * i / 20); model.updateMatrixWorld(true); models[kind].union(new Box3().setFromObject(model)); }
      mixer.stopAllAction();
    }
    mixer.uncacheRoot(gltf.scene);
  }
  const measurements = [];
  for (const [width, height] of viewports) for (const pose of poses) {
    const c = xyz(pose.cargo), d = xyz(pose.drone), goal = { x: 6, y: 0, z: 0 };
    const frame = cameraFrame(c, d, goal, width, height, true);
    const camera = new PerspectiveCamera(frame.fov, width / height, .1, 160);
    camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld(true);
    const old = new PerspectiveCamera(54, width / height, .1, 160);
    const desktop = cameraFrame(c, d, goal, width, height, false);
    old.position.copy(desktop.position); old.lookAt(desktop.target); old.updateMatrixWorld(true);
    const distance = Math.max(19, Math.max(10, Math.abs(goal.x - c.x) + 5) / Math.max(.3, width / height) * 1.25);
    expect(desktop.fov).toBe(43);
    expect(desktop.target.toArray()).toEqual([(Math.min(c.x, d.x, 6) + Math.max(c.x, d.x, 6)) / 2, 0, (c.z + d.z) / 4]);
    expect(desktop.position.toArray()).toEqual(desktop.target.clone().add(new Vector3(-distance * .24, distance * .82, distance * .66)).toArray());
    const subjects = [];
    for (const kind of ['cargo', 'drone', 'dock'] as const) {
      const offset = new Vector3(...(kind === 'cargo' ? pose.cargo : kind === 'drone' ? pose.drone : [6, -.65, 0]));
      const box = models[kind].clone().translate(offset);
      if (kind !== 'dock') box.union(new Box3(offset.clone().sub(new Vector3(...(kind === 'cargo' ? [1, .6, .8] : [.8, .4, .6]))), offset.clone().add(new Vector3(...(kind === 'cargo' ? [1, .6, .8] : [.8, .4, .6])))));
      const points = kind === 'dock' ? corners(box) : [0, Math.PI / 4, Math.PI / 2].flatMap(yaw => corners(box).map(p => p.sub(offset).applyMatrix4(new Matrix4().makeRotationY(yaw)).add(offset)));
      const current = project(points, camera, width, height), previous = project(points, old, width, height);
      for (const [x, y, z] of current.points) { expect(Math.abs(x)).toBeLessThanOrEqual(.9); expect(Math.abs(y)).toBeLessThanOrEqual(.9); expect(z).toBeGreaterThan(-1); expect(z).toBeLessThan(1); }
      if (pose.name === 'depart' && kind !== 'dock') { expect(current.width * current.height).toBeGreaterThan(previous.width * previous.height); }
      subjects.push({ kind, old: previous, new: current });
    }
    measurements.push({ viewport: [width, height], fixture: pose.name, fov: frame.fov, position: frame.position.toArray(), target: frame.target.toArray(), subjects });
  }
  writeFileSync('packages/demo-space-dock/proofs/summary-v2/projections.json', JSON.stringify({ bounds: models, measurements }, null, 2) + '\n');
});
