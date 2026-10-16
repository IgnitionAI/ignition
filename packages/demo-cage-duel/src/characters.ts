import * as T from 'three';
import type { Fighter } from './duel';
const metal = new T.MeshStandardMaterial({ color: 0x20282c, roughness: .4, metalness: .85 });
const brass = new T.MeshStandardMaterial({ color: 0xc19759, roughness: .45, metalness: .78 });
const rubber = new T.MeshStandardMaterial({ color: 0x101315, roughness: .88 });
const steel = new T.MeshStandardMaterial({ color: 0x899694, roughness: .32, metalness: .9 });
export function box(parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material): T.Mesh {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
function sphere(parent: T.Object3D, r: number, x: number, y: number, z: number, material: T.Material, sx = 1, sy = 1, sz = 1): T.Mesh {
    const m = new T.Mesh(new T.SphereGeometry(r, 12, 8), material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    parent.add(m);
    return m;
}
function plate(parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material): T.Mesh {
    const shape = new T.Shape();
    const c = Math.min(w, h) * .16;
    shape.moveTo(-w / 2 + c, -h / 2);
    shape.lineTo(w / 2 - c, -h / 2);
    shape.lineTo(w / 2, -h / 2 + c);
    shape.lineTo(w / 2, h / 2 - c);
    shape.lineTo(w / 2 - c, h / 2);
    shape.lineTo(-w / 2 + c, h / 2);
    shape.lineTo(-w / 2, h / 2 - c);
    shape.lineTo(-w / 2, -h / 2 + c);
    shape.closePath();
    const mesh = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .025, bevelThickness: .025 }), material);
    mesh.position.set(x, y, z - d / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
export class Warrior {
    root = new T.Group();
    body = new T.Group();
    arms = [new T.Group(), new T.Group()];
    legs = [new T.Group(), new T.Group()];
    constructor(color: number, eyeColor: number, variant: number) {
        const paint = new T.MeshStandardMaterial({ color, roughness: .5, metalness: .65 });
        const eye = new T.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 3 });
        this.root.add(this.body);
        box(this.body, .75, .75, .5, 0, 1.62, 0, rubber);
        plate(this.body, 1.15, .68, .6, 0, 2.08, 0, paint);
        plate(this.body, .9, .15, .08, 0, 2.34, .36, brass);
        plate(this.body, .68, .25, .08, 0, 2.03, .39, metal);
        // Chest crest and machined fasteners.
        for (const s of [-1, 1])
            for (let i = 0; i < 3; i++) {
                const wing = box(this.body, .13, .035, .045, s * (.12 + i * .105), 2.09 - i * .035, .465, brass);
                wing.rotation.z = s * .3;
            }
        sphere(this.body, .07, 0, 2.08, .47, steel, 1, 1.25, .5);
        for (let i = 0; i < 3; i++)
            plate(this.body, .66 - i * .04, .15, .09, 0, 1.76 - i * .14, .3, metal);
        box(this.body, .9, .18, .6, 0, 1.34, 0, brass);
        plate(this.body, .27, .25, .12, 0, 1.33, .35, steel);
        for (const s of [-1, 1])
            plate(this.body, .28, .45, .15, s * .37, 1.15, .24, paint);
        // Backpack, twin exhausts, recessed vents.
        box(this.body, .8, .65, .35, 0, 2, -.48, metal);
        for (const s of [-1, 1]) {
            sphere(this.body, .18, s * .43, 2.37, -.5, metal, 1, 1.7, 1);
            for (let j = 0; j < 4; j++)
                box(this.body, .2, .035, .08, s * .43, 2.2 + j * .07, -.67, rubber);
        }
        sphere(this.body, .24, 0, 2.62, 0, paint, 1, 1.2, 1);
        plate(this.body, .43, .3, .3, 0, 2.6, .12, paint);
        box(this.body, .4, .055, .035, 0, 2.67, .305, rubber);
        for (const s of [-1, 1]) {
            const slit = box(this.body, .135, .035, .025, s * .108, 2.67, .33, eye);
            slit.rotation.z = s * .15;
        }
        plate(this.body, .24, .16, .08, 0, 2.48, .32, metal);
        for (let i = -2; i <= 2; i++)
            box(this.body, .02, .09, .025, i * .038, 2.48, .37, steel);
        box(this.body, .065, .055, .32, 0, 2.89, 0, brass);
        for (let i = 0; i < 2; i++) {
            const s = i === 0 ? -1 : 1, arm = this.arms[i];
            arm.position.set(s * .69, 2.22, 0);
            this.body.add(arm);
            sphere(arm, .31, 0, 0, 0, metal, 1.15, .9, 1.15);
            sphere(arm, .33, s * .035, .055, 0, paint, 1.15, .82, 1.13);
            plate(arm, .39, .35, .07, s * .08, -.07, .31, brass);
            plate(arm, .29, .25, .08, s * .08, -.07, .36, paint);
            for (const px of [-.13, .13])
                for (const py of [-.12, .12])
                    sphere(arm, .025, s * .08 + px, py - .07, .42, steel);
            box(arm, .29, .47, .3, 0, -.32, 0, paint);
            sphere(arm, .17, 0, -.59, 0, rubber);
            plate(arm, .34, .4, .37, 0, -.79, .02, paint);
            box(arm, .36, .07, .39, 0, -.91, .02, brass);
            box(arm, .23, .2, .25, 0, -1.08, .04, metal);
            for (let k = 0; k < 3; k++)
                box(arm, .055, .08, .04, (k - 1) * .065, -1.04, .19, steel);
            const leg = this.legs[i];
            leg.position.set(s * .26, 1.15, 0);
            this.root.add(leg);
            box(leg, .35, .43, .39, 0, -.23, 0, paint);
            sphere(leg, .19, 0, -.47, .07, metal);
            plate(leg, .39, .32, .12, 0, -.49, .23, brass);
            plate(leg, .29, .23, .13, 0, -.49, .27, paint);
            plate(leg, .42, .43, .4, 0, -.76, .02, paint);
            box(leg, .45, .11, .46, 0, -.89, .02, brass);
            plate(leg, .46, .23, .66, 0, -1.03, .13, metal);
        }
        const axe = this.arms[1];
        const handle = new T.Mesh(new T.CylinderGeometry(.045, .045, 1.35, 8), metal);
        handle.position.set(0, -.8, .35);
        axe.add(handle);
        for (let i = 0; i < 5; i++)
            box(axe, .1, .025, .1, 0, -.95 + i * .085, .35, brass);
        const blade = plate(axe, .66, .47, .12, .19, -.19, .35, steel);
        blade.rotation.z = -.35;
        plate(axe, .4, .3, .14, .17, -.18, .35, paint);
        for (let i = 0; i < 5; i++) {
            const tooth = box(axe, .07, .11, .12, .02 + i * .1, -.43 - i * .035, .35, brass);
            tooth.rotation.z = -.35;
        }
        if (variant) {
            for (const s of [-1, 1]) {
                const horn = new T.Mesh(new T.ConeGeometry(.07, .38, 5), brass);
                horn.position.set(s * .27, 2.95, 0);
                horn.rotation.z = -s * .4;
                this.body.add(horn);
            }
        }
    }
    update(f: Fighter, other: Fighter, time: number, moving: boolean): void {
        this.root.position.lerp(new T.Vector3(f.x, 0, f.z), .28);
        this.root.rotation.y = Math.atan2(other.x - f.x, other.z - f.z);
        const walk = moving ? Math.sin(time * 10) * .22 : Math.sin(time * 1.8) * .015;
        this.legs[0].rotation.x = walk;
        this.legs[1].rotation.x = -walk;
        this.body.position.y = Math.abs(walk) * .08;
        this.arms[0].rotation.x = f.guard ? -1.25 : walk * .4;
        this.arms[1].rotation.x = f.phase === 'windup' ? -1.9 + (4 - f.timer) * .1 : f.phase === 'recover' ? .65 - f.timer * .16 : f.guard ? -1.3 : -walk * .4;
        this.arms[1].rotation.z = f.phase === 'windup' ? -.25 : f.guard ? -.5 : -.08;
        this.body.rotation.z = f.phase === 'stunned' ? .13 * Math.sin(time * 24) : 0;
        if (f.health <= 0) {
            this.root.rotation.x = T.MathUtils.lerp(this.root.rotation.x, -1.35, .08);
            this.root.position.y = -.15;
        }
        else
            this.root.rotation.x = 0;
    }
}
