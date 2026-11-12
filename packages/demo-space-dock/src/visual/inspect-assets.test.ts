import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export async function loadAsset(name: string) {
  const bytes = readFileSync(`packages/demo-space-dock/public/models/${name}.glb`);
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}
test('inspect original bounds', async () => {
  for (const [name, scale, yaw] of [['drone-remorqueur', .5, -Math.PI/2], ['cargo-orbitale', .65, 0], ['poste-arrimage', 1, -Math.PI/2]] as const) {
    const asset = await loadAsset(name); const root = new Group(); root.add(asset.scene); root.scale.setScalar(scale); root.rotation.y = yaw; root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    console.log(name, { min: box.min.toArray(), max: box.max.toArray(), size: box.getSize(new Vector3()).toArray() });
  }
});
