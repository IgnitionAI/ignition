import * as T from 'three';
import type { Fighter } from './duel';
/** Rigid Blender pivots, preserved by the GLB export. */
export class BlenderWarrior {
    root = new T.Group();
    private pivots = new Map<string, T.Object3D>();
    constructor(source: T.Object3D, opponent: boolean) {
        const model = source.clone(true);
        model.scale.setScalar(.86);
        model.traverse(o => {
            this.pivots.set(o.name.replace(/\.?\d{3}$/, '').replace(/(UpperArm|Forearm|Thigh|Shin|Foot|Hand|Shoulder)([LR])$/, '$1.$2'), o);
            if (o instanceof T.Mesh) {
                o.castShadow = o.receiveShadow = true;
                const recolor = (m: T.MeshStandardMaterial) => {
                    const copy = m.clone();
                    if (opponent && /oxblood/i.test(m.name)) copy.color.set(0x687574);
                    copy.envMapIntensity = .4;
                    copy.roughness = Math.max(.5, copy.roughness);
                    return copy;
                };
                o.material = Array.isArray(o.material) ? o.material.map(recolor) : recolor(o.material);
            }
        });
        this.root.add(model);
    }
    update(f: Fighter, other: Fighter, time: number, moving: boolean): void {
        this.root.position.lerp(new T.Vector3(f.x, 0, f.z), .2);
        this.root.rotation.y = Math.atan2(other.x - f.x, other.z - f.z);
        const pose = (name: string, x: number, y = 0, z = 0) => {
            const p = this.pivots.get(name);
            if (p) { p.rotation.x = T.MathUtils.lerp(p.rotation.x, x, .2); p.rotation.y = T.MathUtils.lerp(p.rotation.y, y, .2); p.rotation.z = T.MathUtils.lerp(p.rotation.z, z, .2); }
        };
        const walk = moving ? Math.sin(time * 9) * .22 : .015 * Math.sin(time * 2);
        const wind = f.phase === 'windup' && f.timer > 1, strike = (f.phase === 'recover' && f.timer > 3) || (f.phase === 'windup' && f.timer <= 1);
        const side = f.direction === 1 ? -1 : f.direction === 2 ? 1 : 0;
        pose('Thigh.L', walk); pose('Thigh.R', -walk);
        pose('Shin.L', Math.max(0, -walk)); pose('Shin.R', Math.max(0, walk));
        pose('Torso', f.phase === 'stunned' ? -.2 : .04, wind ? side * -.4 : strike ? side * .4 : 0);
        pose('UpperArm.R', wind ? -2.3 : strike ? -.25 : f.guard ? -1.2 : -.35, 0, wind ? side * .85 : f.guard ? side * .5 : -.12);
        pose('Forearm.R', wind ? -.6 : f.guard ? -.85 : -.3);
        pose('UpperArm.L', f.guard ? -1.1 : -.35, 0, .18);
        pose('Forearm.L', -.7);
        this.root.rotation.x = T.MathUtils.lerp(this.root.rotation.x, f.health <= 0 ? -1.45 : 0, .07);
    }
}
