import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { box } from './characters';
import { BlenderWarrior } from './blender-warrior';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Duel } from './duel';
export class ArenaView {
    renderer: T.WebGLRenderer;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(53, 1, .1, 100);
    controls: OrbitControls;
    warriors: BlenderWarrior[] = [];
    ready: Promise<void>;
    combat = false;
    private shake = 0;
    private lastPositions = [new T.Vector2(), new T.Vector2()];
    private movingUntil = [0, 0];
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
        this.renderer.toneMappingExposure = 1.1;
        const pmrem = new T.PMREMGenerator(this.renderer);
        const room = new RoomEnvironment();
        this.scene.environment = pmrem.fromScene(room, .04).texture;
        room.dispose(); pmrem.dispose();
        host.append(this.renderer.domElement);
        this.scene.background = new T.Color(0x0b1013);
        this.scene.fog = new T.FogExp2(0x0b1013, .035);
        this.camera.position.set(4.6, 2.8, -1.3);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.1, 0);
        this.controls.enableDamping = true;
        this.controls.enabled = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 23;
        this.controls.maxPolarAngle = Math.PI * .47;
        this.controls.minPolarAngle = .25;
        this.controls.enablePan = false;
        this.scene.add(new T.HemisphereLight(0xb3d9ea, 0x1a1010, .65));
        const key = new T.SpotLight(0xffc99b, 290, 35, .65, .6, 1.5);
        key.position.set(2, 10, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.bias = -.0003;
        this.scene.add(key);
        const rim = new T.PointLight(0x70d3ee, 140, 22, 1.4);
        rim.position.set(-4, 5, -4);
        this.scene.add(rim);
        this.light = new T.PointLight(0xff752d, 0, 6, 1.5);
        this.scene.add(this.light);
        const dark = new T.MeshStandardMaterial({ color: 0x171d20, metalness: .8, roughness: .42 });
        const trim = new T.MeshStandardMaterial({ color: 0x7b6850, metalness: .8, roughness: .5 });
        const red = new T.MeshStandardMaterial({ color: 0xce4b2e, emissive: 0xdd3011, emissiveIntensity: 2 });
        this.ready = Promise.all([
            new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/cage-blender.glb`),
            new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/marine-base-blender.glb`)
        ]).then(([cage, marine]) => {
            cage.scene.traverse(o => { if (o instanceof T.Mesh) o.castShadow = o.receiveShadow = true; });
            this.scene.add(cage.scene);
            this.warriors = [new BlenderWarrior(marine.scene, false), new BlenderWarrior(marine.scene, true)];
            this.warriors.forEach(w => this.scene.add(w.root));
        });
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
    closeup(): void { this.combat = false; }
    wide(): void { this.combat = true; }
    projectEnemy(duel: Duel): { x: number; y: number } {
        const f = duel.fighters[1];
        const v = new T.Vector3(f.x, 2.1, f.z).project(this.camera);
        return { x: (v.x + 1) * 50, y: (1 - v.y) * 50 };
    }
    render(duel: Duel, time: number): void {
        this.warriors.forEach((w, i) => { const f = duel.fighters[i], old = this.lastPositions[i]; if (old.distanceTo(new T.Vector2(f.x, f.z)) > .005) this.movingUntil[i] = time + .15; w.update(f, duel.fighters[1 - i], time, time < this.movingUntil[i]); old.set(f.x, f.z); });
        if (duel.events.length && this.lastEventTick !== duel.tick) {
            this.lastEventTick = duel.tick;
            const f = duel.fighters[duel.events[0].target];
            this.light.position.set(f.x, 1.9, f.z);
            this.light.intensity = 70;
            this.shake = .055;
            this.sparks.forEach((s, i) => { s.visible = true; s.position.set(f.x, 1.8, f.z); s.userData.birth = time; s.userData.velocity = new T.Vector3(Math.sin(i * 13) * 2, Math.cos(i * 17) * 2 + 2, Math.cos(i * 9) * 2); });
        }
        this.light.intensity *= .83;
        this.sparks.forEach(s => { if (!s.visible)
            return; const age = time - s.userData.birth; if (age > .45) {
            s.visible = false;
            return;
        } s.position.addScaledVector(s.userData.velocity, .016); s.position.y -= age * .07; });
        const a = this.warriors[0]?.root.position ?? new T.Vector3(0, 0, 2.25);
        const b = this.warriors[1]?.root.position ?? new T.Vector3(0, 0, -2.25);
        if (this.combat) {
            const away = a.clone().sub(b).setY(0).normalize();
            const shoulder = new T.Vector3(away.z, 0, -away.x).multiplyScalar(2.3);
            const eye = a.clone().addScaledVector(away, 3.5).add(shoulder).setY(3.4);
            const radius = Math.hypot(eye.x, eye.z);
            if (radius > 5.5) { eye.x *= 5.5 / radius; eye.z *= 5.5 / radius; }
            this.camera.position.lerp(eye, .075);
            this.controls.target.lerp(a.clone().lerp(b, .75).setY(1.7), .1);
        } else {
            this.camera.position.lerp(new T.Vector3(4.4 + Math.sin(time * .1) * .3, 2.5, -.1), .04);
            this.controls.target.lerp(a.clone().setY(1.65), .06);
        }
        this.camera.lookAt(this.controls.target);
        this.camera.rotation.z += Math.sin(time * 100) * this.shake;
        this.shake *= .85;
        this.renderer.render(this.scene, this.camera);
        this.frame++;
        if (performance.now() - this.started > 1000) {
            this.fps = Math.round(this.frame * 1000 / (performance.now() - this.started));
            this.frame = 0;
            this.started = performance.now();
        }
    }
}
