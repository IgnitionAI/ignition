import './animation-lab.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mixamoCatalog as combatCatalog } from './mixamo-catalog';

type Direction = 'top' | 'left' | 'right' | 'bottom';
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#131b20');
scene.fog = new THREE.FogExp2('#131b20', .035);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .05, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
el('stage').append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
controls.minDistance = 2; controls.maxDistance = 13; controls.maxPolarAngle = Math.PI * .48;
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, .03).texture; room.dispose(); pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xd3e5ff, 0x292522, 1.5));
const key = new THREE.DirectionalLight(0xffddb1, 3.5); key.position.set(2, 7, 4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, far: 25 });
key.shadow.normalBias = .025; scene.add(key);
const rim = new THREE.DirectionalLight(0x819fcb, 2); rim.position.set(-4, 5, -5); scene.add(rim);
const targetRing = new THREE.Mesh(new THREE.RingGeometry(.68, .71, 64), new THREE.MeshBasicMaterial({ color: 0xd8ad55, side: THREE.DoubleSide }));
targetRing.rotation.x = -Math.PI / 2; targetRing.position.set(0, .18, -1.5); scene.add(targetRing);
let player: THREE.Object3D | undefined, mixer: THREE.AnimationMixer | undefined, enemyMixer: THREE.AnimationMixer | undefined;
let active: THREE.AnimationAction | undefined, selected = 'mx_standing_idle', direction: Direction = 'top', paused = false;
const actions = new Map<string, THREE.AnimationAction>(), clips = new Map<string, THREE.AnimationClip>();
const keys = new Set<string>(); let moving = false;
const speed = el<HTMLSelectElement>('speed'), loop = el<HTMLInputElement>('loop'), timeline = el<HTMLInputElement>('timeline');
const category = el<HTMLSelectElement>('category');
for (const name of ['Toutes', ...new Set(combatCatalog.map(c => c.category))]) category.add(new Option(name, name));
function catalog(): void {
    el('catalog').replaceChildren();
    for (const entry of combatCatalog.filter(c => category.value === 'Toutes' || c.category === category.value)) {
        const button = document.createElement('button'); button.textContent = entry.label;
        button.dataset.clip = entry.name; button.disabled = !actions.has(entry.name);
        button.setAttribute('aria-pressed', String(entry.name === selected)); button.onclick = () => play(entry.name);
        el('catalog').append(button);
    }
}
category.onchange = catalog;
function setPaused(value: boolean): void { paused = value; el('pause').textContent = paused ? 'Reprendre' : 'Pause'; }
function play(name: string): void {
    const next = actions.get(name); if (!next || !mixer) return;
    // Stop previous actions so scrubbing always evaluates only the selected movement.
    mixer.stopAllAction(); next.reset(); next.enabled = true; next.setEffectiveWeight(1);
    selected = name; active = next;
    const entry = combatCatalog.find(c => c.name === name)!;
    loop.checked = entry.loop; next.setLoop(entry.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    next.clampWhenFinished = true; next.play(); setPaused(false); mixer.update(0);
    el('current').textContent = entry.label; el('status').textContent = `${combatCatalog.length} mouvements disponibles · ${next.getClip().duration.toFixed(2)} s · Mixamo / ${entry.source}`;
    document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.clip === name)));
}
function guard(d: Direction): void {
    direction = d; document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === d)));
    play('mx_standing_block_idle');
}
document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(b => { b.onclick = () => guard(b.dataset.direction as Direction); });
el('replay').onclick = () => play(selected); el('pause').onclick = () => setPaused(!paused);
loop.onchange = () => { if (active) { active.setLoop(loop.checked ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); active.paused = false; } };
timeline.oninput = () => {
    if (!active || !mixer) return; setPaused(true);
    active.paused = true; active.time = Number(timeline.value) * active.getClip().duration; mixer.update(0);
    el('time').textContent = active.time.toFixed(2) + ' s';
};
function reset(): void {
    if (player) { player.position.set(0, .17, 1.8); player.rotation.y = Math.PI; }
    controls.target.set(0, 1.25, .2); camera.position.set(3.8, 3.4, 3.6); controls.update();
}
el('reset').onclick = () => { keys.clear(); moving = false; reset(); guard(direction); };
function editable(target: EventTarget | null): boolean { return target instanceof HTMLElement && !!target.closest('input,select,textarea'); }
window.addEventListener('keydown', e => {
    if (editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' ','z','w','s','a','q','d','1','2','3','4','f','b','p'].includes(key)) e.preventDefault();
    keys.add(key); if (e.repeat) return;
    const dirs: Record<string, Direction> = { arrowup: 'top', arrowdown: 'bottom', arrowleft: 'left', arrowright: 'right' };
    if (dirs[key]) guard(dirs[key]);
    const attacks: Partial<Record<Direction, string>> = { left: 'backhand', right: 'horizontal', top: 'downward' };
    const commands: Record<string, string | undefined> = {
        '1': attacks[direction] ? 'mx_standing_melee_attack_' + attacks[direction] : undefined,
        '2': 'mx_standing_melee_combo_attack_ver_1', '3': 'mx_standing_melee_punch',
        '4': 'mx_standing_dodge_' + ({ top: 'forward', bottom: 'backward', left: 'left', right: 'right' }[direction]),
        b: 'mx_standing_block_react_large'
    };
    if ((key === '1' && !commands[key]) || key === 'f' || key === 'p') {
        el('status').textContent = 'Ce mouvement précis reste à adapter : aucun clip Mixamo équivalent validé dans ce catalogue.';
    }
    if (commands[key]) play(commands[key]!); if (key === ' ') setPaused(!paused);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); moving = false; setPaused(true); });
function layout(): void {
    const left = innerWidth <= 850 ? 200 : 310;
    const bottom = document.querySelector('footer')!.getBoundingClientRect().height;
    const width = Math.max(1, innerWidth - left), height = Math.max(1, innerHeight - bottom - 65);
    renderer.setSize(innerWidth, innerHeight); renderer.setViewport(left, bottom, width, height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
}
window.addEventListener('resize', layout);
new ResizeObserver(layout).observe(document.querySelector('footer')!);
layout();
const loader = new GLTFLoader();
async function load(): Promise<void> {
    try {
        const [cage, asset] = await Promise.all([
            loader.loadAsync(import.meta.env.BASE_URL + 'models/cage-blender.glb'),
            loader.loadAsync(import.meta.env.BASE_URL + 'models/purchased/blood-angel-mixamo.glb')
        ]);
        for (const entry of combatCatalog) if (!asset.animations.some(a => a.name === entry.name)) throw new Error('Animation absente : ' + entry.name);
        scene.add(cage.scene); player = asset.scene; scene.add(player);
        const enemy = clone(asset.scene); enemy.position.set(0, .17, -1.5); scene.add(enemy);
        scene.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
        mixer = new THREE.AnimationMixer(player); enemyMixer = new THREE.AnimationMixer(enemy);
        for (const clip of asset.animations) { clips.set(clip.name, clip); actions.set(clip.name, mixer.clipAction(clip)); }
        enemyMixer.clipAction(clips.get('mx_standing_idle')!).play();
        reset(); catalog(); guard('top');
    } catch (error) {
        el('current').textContent = 'Chargement impossible';
        el('status').textContent = error instanceof Error ? error.message : String(error);
    }
}
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), .05), rate = Number(speed.value);
    if (player && mixer) {
        const forward = Number(keys.has('z') || keys.has('w')) - Number(keys.has('s'));
        const lateral = Number(keys.has('d')) - Number(keys.has('q') || keys.has('a'));
        if ((forward || lateral) && !paused) {
            const movement = Math.abs(lateral) > Math.abs(forward) ? (lateral > 0 ? 'right' : 'left') : (forward > 0 ? 'forward' : 'backward');
            const moveName = 'mx_standing_walk_' + (movement === 'backward' ? 'back' : movement);
            if (selected !== moveName) play(moveName); moving = true;
            const toward = new THREE.Vector3(0, 0, -1.5).sub(player.position); toward.y = 0; toward.normalize();
            const right = new THREE.Vector3(-toward.z, 0, toward.x);
            const capturedSpeed = combatCatalog.find(c => c.name === moveName)?.speed ?? .7;
            const delta = toward.multiplyScalar(forward).addScaledVector(right, lateral).normalize().multiplyScalar(dt * Math.max(.1, capturedSpeed) * rate);
            const candidate = player.position.clone().add(delta);
            if (Math.hypot(candidate.x, candidate.z) < 4.7 && Math.hypot(candidate.x, candidate.z + 1.5) > 1.45) player.position.copy(candidate);
            player.rotation.y = Math.atan2(-player.position.x, -1.5 - player.position.z);
        } else if (moving && !forward && !lateral) { moving = false; if (!paused) play('mx_standing_idle'); }
        if (!paused) { if (active) active.paused = false; mixer.update(dt * rate); enemyMixer?.update(dt * rate); }
        if (active) { timeline.value = String(active.time / active.getClip().duration); el('time').textContent = active.time.toFixed(2) + ' s'; }
    }
    controls.update(); renderer.render(scene, camera);
});
catalog(); reset(); void load();
