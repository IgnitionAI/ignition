import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Warrior, box } from './characters';
import type { Duel } from './duel';
export class ArenaView {
    renderer: T.WebGLRenderer;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(43, 1, .1, 100);
    controls: OrbitControls;
    warriors = [new Warrior(0x842d28, 0xffb75f, 0), new Warrior(0x2f4850, 0x78edee, 1)];
    private lastPositions = [new T.Vector2(), new T.Vector2()];
    private sparks: T.Mesh[] = [];
    private light: T.PointLight;
    private lastEventTick = -1;
    private frame = 0;
    private started = performance.now();
    fps = 0;
    constructor(private host: HTMLElement) {
        this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = T.PCFSoftShadowMap;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        host.append(this.renderer.domElement);
        this.scene.background = new T.Color(0x0b1013);
        this.scene.fog = new T.FogExp2(0x0b1013, .035);
        this.camera.position.set(8, 5.5, 10);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.1, 0);
        this.controls.enableDamping = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 23;
        this.controls.maxPolarAngle = Math.PI * .47;
        this.controls.minPolarAngle = .25;
        this.controls.enablePan = false;
        this.scene.add(new T.HemisphereLight(0xb3d9ea, 0x1a1010, 1.8));
        const key = new T.SpotLight(0xffc99b, 180, 35, .65, .6, 1.5);
        key.position.set(2, 10, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.bias = -.0003;
        this.scene.add(key);
        const rim = new T.PointLight(0x70d3ee, 65, 22, 1.4);
        rim.position.set(-4, 5, -4);
        this.scene.add(rim);
        this.light = new T.PointLight(0xff752d, 0, 6, 1.5);
        this.scene.add(this.light);
        const floorMat = new T.MeshStandardMaterial({ color: 0x333a3b, metalness: .8, roughness: .55 });
        const dark = new T.MeshStandardMaterial({ color: 0x171d20, metalness: .8, roughness: .42 });
        const trim = new T.MeshStandardMaterial({ color: 0x7b6850, metalness: .8, roughness: .5 });
        const red = new T.MeshStandardMaterial({ color: 0xce4b2e, emissive: 0xdd3011, emissiveIntensity: 2 });
        const platform = new T.Mesh(new T.CylinderGeometry(6.2, 6.5, .35, 8), floorMat);
        platform.position.y = -.2;
        platform.receiveShadow = true;
        this.scene.add(platform);
        const ring = new T.Mesh(new T.TorusGeometry(5.65, .035, 6, 96), red);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = .015;
        this.scene.add(ring);
        const lineMat = new T.LineBasicMaterial({ color: 0x5c6360, transparent: true, opacity: .35 });
        const lines: number[] = [];
        for (let i = -5; i <= 5; i++) {
            const length = Math.sqrt(30 - i * i);
            lines.push(-length, .007, i, length, .007, i, i, .007, -length, i, .007, length);
        }
        this.scene.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(lines, 3)), lineMat));
        // Central industrial insignia, no franchise logos.
        for (let i = 0; i < 3; i++) {
            const m = box(this.scene, 1.5 - i * .3, .012, .12, 0, .012, -.35 + i * .28, trim);
            m.rotation.y = -.35;
        }
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4, x = Math.sin(angle) * 6, z = Math.cos(angle) * 6;
            const pillar = new T.Group();
            pillar.position.set(x, 0, z);
            pillar.rotation.y = angle;
            if (z < 1)
                this.scene.add(pillar);
            box(pillar, .22, 4.2, .28, 0, 2, 0, dark);
            box(pillar, .42, .35, .45, 0, .13, 0, trim);
            box(pillar, .1, 1.2, .06, 0, 2.9, -.18, red);
            const lamp = new T.PointLight(0xff4020, 5, 5, 1.7);
            lamp.position.set(x, 3, z);
            this.scene.add(lamp);
            // Cage is cut away on the camera side so combat stays legible.
            const next = (i + 1) * Math.PI / 4, mx = (x + Math.sin(next) * 6) / 2, mz = (z + Math.cos(next) * 6) / 2;
            const segment = new T.Group();
            segment.position.set(mx, 0, mz);
            segment.rotation.y = angle + Math.PI / 8;
            this.scene.add(segment);
            if (mz < 1.5)
                box(segment, 4.6, .16, .15, 0, 3.9, 0, dark);
            box(segment, 4.6, .12, .15, 0, .18, 0, dark);
            if (mz < 1.5) {
                for (let j = 0; j < 17; j++)
                    box(segment, .027, 3.65, .025, -2.15 + j * .27, 2, 0, dark);
                for (let j = 0; j < 12; j++)
                    box(segment, 4.5, .025, .025, 0, .4 + j * .3, 0, dark);
            }
        }
        // Hull ribs and a distant circular reactor establish the ship's scale.
        box(this.scene, 55, .2, 55, 0, -1.4, 0, dark);
        for (let i = 0; i < 7; i++) {
            const z = -18 + i * 5;
            for (const s of [-1, 1]) {
                const beam = box(this.scene, .7, 15, .8, s * 12, 5, z, dark);
                beam.rotation.z = -s * .22;
                box(this.scene, .14, 7, .15, s * 10.5, 4, z, red);
            }
            box(this.scene, 25, .7, .8, 0, 12, z, dark);
        }
        const reactor = new T.Mesh(new T.TorusGeometry(4, .18, 8, 60), red);
        reactor.position.set(0, 5, -22);
        this.scene.add(reactor);
        const reactorCore = new T.Mesh(new T.CircleGeometry(4, 48), dark);
        reactorCore.position.set(0, 5, -22.1);
        this.scene.add(reactorCore);
        for (let i = 0; i < 8; i++) {
            const rib = box(this.scene, .1, 8, .1, 0, 5, -21.9, trim);
            rib.rotation.z = i * Math.PI / 8;
        }
        const points: number[] = [];
        for (let i = 0; i < 150; i++)
            points.push(Math.sin(i * 71) * 18, ((i * 37) % 100) / 10, Math.cos(i * 17) * 20);
        const dust = new T.Points(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(points, 3)), new T.PointsMaterial({ color: 0xffc38b, size: .025, transparent: true, opacity: .5 }));
        this.scene.add(dust);
        this.warriors.forEach(w => this.scene.add(w.root));
        for (let i = 0; i < 18; i++) {
            const spark = new T.Mesh(new T.BoxGeometry(.03, .03, .12), new T.MeshBasicMaterial({ color: 0xffcc80 }));
            spark.visible = false;
            this.scene.add(spark);
            this.sparks.push(spark);
        }
        new ResizeObserver(() => this.resize()).observe(host);
        this.resize();
    }
    resize(): void { const w = this.host.clientWidth, h = this.host.clientHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    closeup(): void { this.camera.position.set(3.7, 3.5, 5.8); this.controls.target.copy(this.warriors[0].root.position).add(new T.Vector3(0, 1.7, 0)); }
    wide(): void { this.camera.position.set(8, 5.5, 10); this.controls.target.set(0, 1.1, 0); }
    render(duel: Duel, time: number): void {
        this.warriors.forEach((w, i) => { const f = duel.fighters[i], old = this.lastPositions[i]; const moving = old.distanceTo(new T.Vector2(f.x, f.z)) > .005; w.update(f, duel.fighters[1 - i], time, moving); old.set(f.x, f.z); });
        if (duel.events.length && this.lastEventTick !== duel.tick) {
            this.lastEventTick = duel.tick;
            const f = duel.fighters[duel.events[0].target];
            this.light.position.set(f.x, 1.9, f.z);
            this.light.intensity = 35;
            this.sparks.forEach((s, i) => { s.visible = true; s.position.set(f.x, 1.8, f.z); s.userData.birth = time; s.userData.velocity = new T.Vector3(Math.sin(i * 13) * 2, Math.cos(i * 17) * 2 + 2, Math.cos(i * 9) * 2); });
        }
        this.light.intensity *= .83;
        this.sparks.forEach(s => { if (!s.visible)
            return; const age = time - s.userData.birth; if (age > .45) {
            s.visible = false;
            return;
        } s.position.addScaledVector(s.userData.velocity, .016); s.position.y -= age * .07; });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.frame++;
        if (performance.now() - this.started > 1000) {
            this.fps = Math.round(this.frame * 1000 / (performance.now() - this.started));
            this.frame = 0;
            this.started = performance.now();
        }
    }
}
