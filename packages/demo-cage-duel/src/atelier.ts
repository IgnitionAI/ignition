/// <reference types="vite/client" />
import './atelier.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const stage = document.querySelector<HTMLDivElement>('#stage')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#11191e');
const camera = new THREE.PerspectiveCamera(38, 1, .05, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * .49;
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmrem.fromScene(environment, .04).texture;
environment.dispose();
pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xcde6ff, 0x10151b, 1.4));
const key = new THREE.DirectionalLight(0xffddbb, 3);
key.position.set(4, 9, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 40 });
key.shadow.normalBias = .025;
scene.add(key);
const fill = new THREE.DirectionalLight(0x88baff, 2);
fill.position.set(-4, 4, -4);
scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x11191e, roughness: .8 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.72;
ground.receiveShadow = true;
scene.add(ground);
const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();
const purchaseMode = new URLSearchParams(location.search).get('model') === 'blood-angel';
type ModelKind = 'marine' | 'cage' | 'blood-angel';
let active: ModelKind = 'marine', request = 0, model: THREE.Group | undefined;
function frameModel(): void {
    if (active !== 'cage') {
        camera.position.set(3, 2.8, 5);
        ground.position.y = -.02;
        controls.target.set(0, active === 'blood-angel' ? 1.35 : 1.7, 0);
        controls.minDistance = 1.3;
        controls.maxDistance = 15;
    } else {
        camera.position.set(9, 10, 14);
        ground.position.y = -.72;
        controls.target.set(0, 1.5, 0);
        controls.minDistance = 3;
        controls.maxDistance = 35;
    }
    controls.update();
}
async function show(kind: ModelKind): Promise<void> {
    const token = ++request;
    active = kind;
    status.textContent = 'Chargement du modèle…';
    for (const name of ['marine', 'cage', 'blood-angel']) document.getElementById(name)!.setAttribute('aria-pressed', String(name === kind));
    try {
        let loaded = cache.get(kind);
        if (!loaded) {
            const filename = { marine: 'marine-base-blender.glb', cage: 'cage-blender.glb', 'blood-angel': 'purchased/blood-angel-inspection.glb' }[kind];
            const result = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${filename}`);
            loaded = result.scene;
            loaded.traverse(o => {
                if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
            });
            cache.set(kind, loaded);
        }
        if (token !== request) return;
        if (model) scene.remove(model);
        model = loaded;
        scene.add(model);
        renderer.toneMappingExposure = kind === 'blood-angel' ? 1 : 1.3;
        frameModel();
        updateMetadata(kind);
        status.textContent = kind === 'blood-angel' ? 'Blood Angel · Jeffry Quiambao · modèle acheté · sans squelette, aperçu statique' : kind === 'marine' ? 'Marine chargé · pièces articulables · matériaux PBR' : 'Cage chargée · grille et entrée ouvertes à l’inspection';
    } catch (error) {
        if (token === request) status.textContent = `Chargement impossible : ${error instanceof Error ? error.message : String(error)}`;
    }
}
document.getElementById('marine')!.onclick = () => void show('marine');
document.getElementById('cage')!.onclick = () => void show('cage');
document.getElementById('reset')!.onclick = frameModel;
new ResizeObserver(() => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}).observe(stage);
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
const originalDescription = document.getElementById('description')!.textContent;
const originalNote = document.querySelector('.note')!.textContent;
function updateMetadata(kind: ModelKind): void {
    const purchased = kind === 'blood-angel';
    document.querySelector('h1')!.textContent = purchased ? 'Blood Angel.' : 'Forgés dans Blender.';
    document.getElementById('description')!.textContent = purchased
        ? 'Le modèle acheté de Jeffry Quiambao, préparé dans Blender. Tournez autour de l’armure et zoomez pour examiner ses détails.'
        : originalDescription;
    document.querySelector('.note')!.textContent = purchased
        ? 'Aperçu local du modèle acheté : 71 pièces, environ 498 000 triangles, textures adaptées en 2K. Aucun squelette fourni dans le FBX ; la préparation au combat reste à faire.'
        : originalNote;
}
if (purchaseMode) document.getElementById('blood-angel')!.hidden = false;
document.getElementById('blood-angel')!.onclick = () => void show('blood-angel');
void show(purchaseMode ? 'blood-angel' : 'marine');
