import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { Matrix4, Quaternion, Vector3 } from 'three';

type Node = { name?: string; children?: number[]; mesh?: number; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] };
function asset(name: string) {
    const data = readFileSync(new URL(`../public/models/${name}.glb`, import.meta.url));
    expect(data.toString('ascii', 0, 4)).toBe('glTF');
    expect(data.readUInt32LE(8)).toBe(data.length);
    return JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
}
it('exports only the requested geometry, without studio or unrelated scenes', () => {
    for (const name of ['cage-blender', 'marine-base-blender']) {
        const gltf = asset(name);
        expect(gltf.scenes).toHaveLength(1);
        expect(gltf.cameras ?? []).toHaveLength(0);
        expect(gltf.skins ?? []).toHaveLength(0);
        expect(gltf.animations ?? []).toHaveLength(0);
        expect(gltf.meshes.length).toBeGreaterThan(0);
        for (const mesh of gltf.meshes) for (const p of mesh.primitives) {
            expect(gltf.accessors[p.attributes.POSITION].count).toBeGreaterThan(0);
            expect(gltf.materials[p.material]).toBeDefined();
        }
    }
    expect(asset('cage-blender').meshes).toHaveLength(1);
});
it('preserves marine articulation pivots in glTF Y-up coordinates', () => {
    const gltf = asset('marine-base-blender');
    const positions = new Map<string, Vector3>();
    function visit(index: number, parent: Matrix4) {
        const n: Node = gltf.nodes[index];
        const local = n.matrix ? new Matrix4().fromArray(n.matrix) : new Matrix4().compose(new Vector3().fromArray(n.translation ?? [0, 0, 0]), new Quaternion().fromArray(n.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(n.scale ?? [1, 1, 1]));
        const world = parent.clone().multiply(local);
        positions.set((n.name ?? '').replace(/\.\d+$/, ''), new Vector3().setFromMatrixPosition(world));
        for (const child of n.children ?? []) visit(child, world);
    }
    for (const root of gltf.scenes[0].nodes) visit(root, new Matrix4());
    expect(positions.get('Head')?.y).toBeCloseTo(2.93, 3);
    expect(positions.get('Hand.R')?.x).toBeCloseTo(1.06, 3);
    expect(positions.get('Hand.R')?.y).toBeCloseTo(1.55, 3);
    expect(positions.get('Shin.L')?.x).toBeCloseTo(-.44, 3);
});
