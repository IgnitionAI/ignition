import './combat-view.css';
import { CombatEffects, CombatAudio } from './combat-effects';
import { ExchangePose } from './exchange-pose';
import { attachChainsword } from './weapon';
import { paintWorldEater } from './world-eater';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Combat, STEP, strikes, movement, type Command, type Fighter, type Move, type Attack } from './combat';
import { mixamoCatalog } from './mixamo-catalog';
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#131b20'); scene.fog = new THREE.FogExp2('#131b20', .035);
const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .05, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; el('stage').append(renderer.domElement);
renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute('aria-label', 'Cage de combat — commandes clavier');
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(); scene.environment = pmrem.fromScene(room, .03).texture; room.dispose(); pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xd3e5ff, 0x292522, 1.5));
const key = new THREE.DirectionalLight(0xffddb1, 3.5); key.position.set(2,7,4); key.castShadow = true; key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera, { left:-7, right:7, top:7, bottom:-7, far:25 }); key.shadow.normalBias = .025; scene.add(key);
const rim = new THREE.DirectionalLight(0x819fcb, 2); rim.position.set(-4,5,-5); scene.add(rim);
const ring = new THREE.Mesh(new THREE.RingGeometry(.73,.76,64), new THREE.MeshBasicMaterial({color:0xd8ad55,side:THREE.DoubleSide})); ring.rotation.x = -Math.PI/2; scene.add(ring);
const effects = new CombatEffects(scene), audio = new CombatAudio();
let hitStop = 0, renderRequested=true;
const soundedSerial = [-1,-1];
const contactPoses: ExchangePose[] = [];
let contactPair: {source:number;target:number;parry:boolean;attack:Attack}|undefined;
let combat = new Combat(), loaded = false, paused = false, accumulator = 0;
let pending: Command['action'], pointerGuard = false, guardTapUntil=-1, feedbackUntil = 0;
const keys = new Set<string>();
let awaitingStart = true;
const models: THREE.Object3D[] = [], mixers: THREE.AnimationMixer[] = [], actions: Map<string,THREE.AnimationAction>[] = [];
const playing: { name: string; serial: number; action?: THREE.AnimationAction; reactionUntil: number }[] = [
    { name:'', serial:-1, reactionUntil:0 }, { name:'', serial:-1, reactionUntil:0 }
];
const attackLabels: Record<Fighter['attack'],string> = { light:'LÉGÈRE', heavy:'LOURDE', punch:'POING', kick:'PIED' };
const phaseLabels = { ready:'EN GARDE', windup:'PRÉPARATION', active:'FRAPPE', recover:'RÉCUPÉRATION', dodge:'ESQUIVE', stunned:'DÉSÉQUILIBRE' };
function message(text: string, duration = 1.2): void { el('feedback').textContent = text; feedbackUntil = combat.time + duration; }
function play(i: number, name: string, serial: number, loop = false): THREE.AnimationAction {
    const state = playing[i], next = actions[i].get(name);
    if (!next) throw new Error('Animation absente : ' + name);
    if (state.name !== name || state.serial !== serial) {
        const previous = state.action;
        next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        next.clampWhenFinished = true; next.play();
        if (previous && previous !== next) { previous.paused = false; previous.fadeOut(.1); next.fadeIn(.1); }
        state.name = name; state.serial = serial; state.action = next;
    }
    return next;
}
function pose(i: number, f: Fighter, dt: number): void {
    const state = playing[i];
    if (state.reactionUntil > combat.time && f.phase !== 'windup' && f.phase !== 'active') { mixers[i].update(dt); return; }
    let name = 'mx_standing_idle', loop = true, progress: number | undefined;
    if (f.phase === 'windup' || f.phase === 'active' || f.phase === 'recover') {
        name = f.attack === 'kick' ? 'mx_standing_melee_attack_kick_ver_1' : f.attack === 'punch' ? 'mx_standing_melee_punch' : f.attack === 'heavy' ? 'mx_standing_melee_attack_downward' : 'mx_standing_melee_attack_horizontal';
        loop = false;
        const rule = strikes[f.attack];
        // Source clips are phase-retimed. Contact at 46% is provisional, not weapon-mesh collision.
        const contact = f.attack==='heavy'||f.attack==='light' ? .38 : .46;
        progress = f.phase === 'windup' ? contact*f.elapsed/rule.windup : f.phase === 'active' ? contact+.12*f.elapsed/rule.active : contact+.12+(1-contact-.12)*Math.min(1, f.elapsed/f.recovery);
        if (f.phase === 'recover' && f.remaining <= .22 && f.chain === 0) { name = 'mx_standing_block_idle'; loop = true; progress = undefined; }
    } else if (f.phase === 'dodge') {
        name = 'mx_standing_dodge_' + ({forward:'forward',back:'backward',left:'left',right:'right'}[f.dodgeMove]); loop = false; progress = f.elapsed/.65;
    } else if (f.phase === 'stunned') { name = 'mx_standing_react_large_gut'; loop = false; }
    else if (f.move) name = 'mx_standing_walk_' + f.move;
    else if (f.guarding) name = 'mx_standing_block_idle';
    const action = play(i, name, f.serial, loop);
    action.paused = progress !== undefined;
    if (progress !== undefined) action.time = Math.min(.999, Math.max(0, progress))*action.getClip().duration;
    else if (f.move) {
        const captured = mixamoCatalog.find(c => c.name === name)?.speed ?? movement.walkSpeed;
        action.setEffectiveTimeScale((f.guarding ? movement.guardSpeed : movement.walkSpeed)/Math.max(.1,captured));
    }
    mixers[i].update(dt);
}
function moveInput(): Move | undefined {
    if (keys.has('q') || keys.has('a')) return 'left'; if (keys.has('d')) return 'right';
    if (keys.has('s')) return 'back'; if (keys.has('z') || keys.has('w')) return 'forward'; return undefined;
}
function updateHUD(): void {
    combat.fighters.forEach((f,i) => {
        el<HTMLMeterElement>('health'+i).value = f.health; el<HTMLMeterElement>('stamina'+i).value = f.stamina;
        el('state'+i).textContent = `${f.health} PV · ${Math.round(f.stamina)} END · ${f.exhausted ? 'ÉPUISÉ' : phaseLabels[f.phase]}`;
    });
    const enemy = combat.fighters[1], incoming = enemy.phase === 'windup' || enemy.phase === 'active';
    el('incoming').textContent = incoming ? attackLabels[enemy.attack] : 'CIBLE VERROUILLÉE';
    el('defense-state').textContent = combat.fighters[0].guarding ? 'GARDE LEVÉE' : '◇';
    el('defend').setAttribute('aria-pressed', String(keys.has('b') || pointerGuard));
    if (combat.time > feedbackUntil) el('feedback').textContent = combat.fighters[0].exhausted ? 'REPRENEZ VOTRE SOUFFLE' : '';
    if (combat.done) { el('finish').hidden = false; el('result').textContent = combat.fighters[0].health > 0 ? 'Victoire.' : combat.fighters[1].health > 0 ? 'Défaite.' : 'Double K.O.'; }
}
function reset(): void {
    renderRequested=true;
    if(recorder?.state==='recording')recorder.stop();
    combat = new Combat(['exercise','showcase'].includes(el<HTMLSelectElement>('opponent').value) ? 2 : 3.8); effects.reset(); audio.reset(); hitStop=0; contactPair=undefined; soundedSerial.fill(-1); pending = undefined; keys.clear(); pointerGuard = false; guardTapUntil=-1; accumulator = 0;
    awaitingStart = true; el('start').hidden = false; el<HTMLButtonElement>('pause').disabled = true;
    playing.forEach(s => { s.serial = -1; s.reactionUntil = 0; });
    el('finish').hidden = true; paused = true; el('pause').textContent = 'Pause'; message('ENTREZ DANS LA CAGE', 2);
}
let recorder:MediaRecorder|undefined, videoUrl:string|undefined, captureTimer:ReturnType<typeof setTimeout>|undefined;
el('record').onclick=async()=>{
    if(recorder?.state==='recording') {recorder.stop();return;}
    el<HTMLSelectElement>('opponent').value='showcase'; el<HTMLInputElement>('inspect-impact').checked=false; reset();
    await audio.start();
    const stream=renderer.domElement.captureStream(60);
    for(const track of audio.stream?.getAudioTracks()??[])stream.addTrack(track);
    const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
    if(!mime){message('Capture vidéo non prise en charge',5);return;}
    const chunks:Blob[]=[];
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8_000_000});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
        clearTimeout(captureTimer);for(const track of stream.getVideoTracks())track.stop();
        if(videoUrl)URL.revokeObjectURL(videoUrl);
        videoUrl=URL.createObjectURL(new Blob(chunks,{type:mime}));
        const link=el<HTMLAnchorElement>('download');link.href=videoUrl;link.download='crucible-echange.webm';link.hidden=false;
        el('record').textContent='Capturer l’échange';
    };
    recorder.start();el('record').textContent='Arrêter la capture';
    el('begin').click();captureTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},8000);
};
el('sound').onclick=()=>{audio.setMuted(!audio.muted);el('sound').textContent=audio.muted?'Son coupé':'Son activé';el('sound').setAttribute('aria-pressed',String(!audio.muted));};
el('begin').onclick = () => { void audio.start(); awaitingStart = false; el('start').hidden = true; el<HTMLButtonElement>('pause').disabled = false; renderer.domElement.focus(); paused = false; el('pause').textContent = 'Pause'; };
function pause(): void { renderRequested=true; if (awaitingStart) return; paused = !paused; if(paused) {audio.pause();if(recorder?.state==='recording')recorder.stop();} else void audio.start(); pending = undefined; keys.clear(); pointerGuard = false; guardTapUntil=-1; accumulator = 0; el('pause').textContent = paused ? 'Reprendre' : 'Pause'; }
el('pause').onclick = pause; el('reset').onclick = reset; el('again').onclick = reset;
el<HTMLSelectElement>('opponent').onchange = reset;
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b => { b.disabled = true; b.onclick = () => { if (!paused && !combat.done) { pending = b.dataset.action as Command['action']; renderer.domElement.focus(); } }; });
el('defend').onclick=()=>{if(!paused&&!combat.done)guardTapUntil=combat.time+.15;};
el('defend').onpointerdown = e => { pointerGuard = true; el('defend').setPointerCapture(e.pointerId); };
el('defend').onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pointerGuard = true; } };
el('defend').onkeyup = () => { pointerGuard = false; };
el('defend').onblur = () => { pointerGuard = false; };
el('defend').onpointerup = el('defend').onpointercancel = () => { pointerGuard = false; };
window.addEventListener('keydown', e => {
    if ((e.target instanceof HTMLElement && e.target.closest('select,input,textarea')) || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === ' ' || e.key === 'Enter') && e.target instanceof HTMLElement && e.target.closest('button')) return;
    const k = e.key.toLowerCase();
    if (['z','q','s','d','w','a','b','1','2','3','4',' ','f','r','escape'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (k === 'escape') { pause(); return; } if (k === 'r') { reset(); return; }
    if (paused || !loaded || combat.done) return; keys.add(k);
    const commands: Record<string,Command['action']> = {'1':'light','2':'heavy','3':'punch','4':'kick',' ':'dodge',f:'feint'};
    if (commands[k]) pending = commands[k];
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { if (!paused) pause(); });
function layout(): void { renderRequested=true; renderer.setSize(innerWidth,innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); }
window.addEventListener('resize', layout); layout();
const loader = new GLTFLoader();
async function load(): Promise<void> {
    try {
        const [cage, asset, sword] = await Promise.all([loader.loadAsync(import.meta.env.BASE_URL+'models/cage-blender.glb'),loader.loadAsync(import.meta.env.BASE_URL+'models/purchased/world-eater-mixamo.glb'),loader.loadAsync(import.meta.env.BASE_URL+'models/chainsword.glb')]);
        scene.add(cage.scene); paintWorldEater(asset.scene); attachChainsword(asset.scene, sword.scene);  models.push(asset.scene,clone(asset.scene));
        for (const model of models) {
            scene.add(model); contactPoses.push(new ExchangePose(model)); const mixer = new THREE.AnimationMixer(model); mixers.push(mixer);
            actions.push(new Map(asset.animations.map(source => {
                const clip = source.clone();
                // Gameplay owns horizontal displacement. Preserve the original catalogue and vertical footwork.
                for (const track of clip.tracks) if (track.name === 'Root.position') {
                    for (let n = 0; n < track.values.length; n += 3) { track.values[n] = 0; track.values[n+2] = 0; }
                }
                return [clip.name,mixer.clipAction(clip)];
            })));
        }
        scene.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
        loaded = true; el<HTMLButtonElement>('record').disabled=false; document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b => b.disabled = false); reset();
    } catch (error) { message('Chargement impossible : '+String(error),Infinity); }
}
const clock = new THREE.Clock();
let measuredSeconds = 0, measuredFrames = 0;
camera.position.set(2.5,3.6,4.6);
const cameraBase=camera.position.clone();
renderer.setAnimationLoop(() => {
    const realDelta = clock.getDelta(), dt = Math.min(realDelta,.05);
    if(loaded&&paused&&!renderRequested)return;
    if (loaded && !paused) {
        measuredSeconds += realDelta; measuredFrames++;
        if (measuredSeconds >= 2) { el('fps').textContent = Math.round(measuredFrames/measuredSeconds)+' FPS'; measuredSeconds = 0; measuredFrames = 0; }
    } else { measuredSeconds = 0; measuredFrames = 0; }
    if (loaded) {
        if (!paused && !combat.done) {
            const stopped = hitStop > 0; hitStop=Math.max(0,hitStop-dt);
            accumulator += stopped ? 0 : dt;
            while (accumulator >= STEP && !combat.done) {
                const mode = el<HTMLSelectElement>('opponent').value;
                const [player,enemy]=combat.fighters;
                const rehearsal=mode==='exercise'||mode==='showcase';
                const automatic: Command = player.riposteUntil>combat.time && player.riposteUntil-combat.time<.23 ? {action:'light'} : {guard:enemy.phase==='windup'&&enemy.remaining<.09};
                const partner: Command = rehearsal ? (enemy.phase==='ready' && combat.time%4<STEP*1.5 ? {action:'heavy'} : {}) : mode==='sparring' ? combat.opponent() : mode==='guard' ? {guard:true} : {};
                combat.step(mode==='showcase'?automatic:{move:moveInput(),guard:keys.has('b')||pointerGuard||combat.time<guardTapUntil,action:pending},partner);
                pending = undefined; accumulator -= STEP;
                for (const event of combat.events) {
                    const labels = {hit:'IMPACT',block:'BLOQUÉ',parry:'PARADE',miss:'HORS DE PORTÉE',evade:'ESQUIVÉ',break:'GARDE BRISÉE',feint:'FEINTE'};
                    message(event.kind==='parry' ? 'PARADE · RIPOSTEZ !' : event.riposte&&event.kind==='hit' ? 'RIPOSTE · IMPACT' : (event.source === 0 ? 'VOUS · ' : 'ADVERSAIRE · ')+labels[event.kind]);
                    if (['hit','block','parry','break'].includes(event.kind)) {
                        const source=combat.fighters[event.source], target=combat.fighters[event.target];
                        contactPair={source:event.source,target:event.target,parry:event.kind==='parry'||event.kind==='block',attack:event.attack};
                        if(event.attack==='heavy'||event.attack==='light') contactPoses[event.source].contact(true,event.attack);
                        if(contactPair.parry) contactPoses[event.target].contact(false);
                        const point=contactPair.parry?contactPoses[event.target].bladePoint(.4):new THREE.Vector3(target.x,1.65,target.z);
                        effects.contact(event,point); audio.contact(event); hitStop=event.kind==='parry'?.075:event.attack==='heavy'?.06:.035;
                        if (event.kind === 'block' || event.kind === 'parry') {
                            play(event.target,'mx_standing_block_react_large',combat.time,false); playing[event.target].reactionUntil = combat.time+.3;
                            if(event.kind==='parry') { play(event.source,'mx_standing_react_large_from_right',combat.time,false);playing[event.source].reactionUntil=combat.time+.65; }
                        }
                        if(event.kind==='hit'||event.kind==='break') { play(event.target,event.attack==='punch'||event.attack==='kick'?'mx_standing_react_large_gut':'mx_standing_react_large_from_left',combat.time,false);playing[event.target].reactionUntil=combat.time+.5; }
                    }
                }
                if(hitStop>0) { accumulator=0; if(el<HTMLInputElement>('inspect-impact').checked) {paused=true;audio.pause();if(recorder?.state==='recording')recorder.stop();el('pause').textContent='Reprendre';} break; }
            }
        }
        combat.fighters.forEach((f,i) => {
            const other = combat.fighters[1-i]; models[i].position.set(f.x,.17,f.z); models[i].rotation.y = Math.atan2(other.x-f.x,other.z-f.z);
            if ((!paused && !combat.done && hitStop<=0) || awaitingStart) { pose(i,f,awaitingStart ? 0 : dt); contactPoses[i].ground(); contactPoses[i].apply(f); }
            if(!paused&&f.phase==='windup'&&f.remaining<.2&&soundedSerial[i]!==f.serial) {audio.swing();soundedSerial[i]=f.serial;}
        });
        if(hitStop>0&&contactPair) {
            if(contactPair.attack==='heavy'||contactPair.attack==='light') contactPoses[contactPair.source].contact(true,contactPair.attack);
            if(contactPair.parry) contactPoses[contactPair.target].contact(false);
        }
        const [p,e] = combat.fighters; ring.position.set(e.x,.18,e.z);
        const toward = new THREE.Vector3(e.x-p.x,0,e.z-p.z).normalize(), right = new THREE.Vector3(-toward.z,0,toward.x);
        // An inside-cage shoulder camera; avoid putting the camera behind the cage walls.
        const desired = new THREE.Vector3(p.x,2.65,p.z).addScaledVector(toward,-3.0).addScaledVector(right,2.4);
        const radius = Math.hypot(desired.x,desired.z); if (radius > 5.1) { desired.x *= 5.1/radius; desired.z *= 5.1/radius; }
        if(!paused||awaitingStart) {if(awaitingStart)cameraBase.copy(desired);else cameraBase.lerp(desired,1-Math.exp(-5*dt));camera.position.copy(cameraBase).add(effects.cameraOffset());camera.lookAt((p.x+e.x)/2,1.55,(p.z+e.z)/2);}
        if(!paused) effects.update(dt);
        if(!paused) audio.motorLoad(combat.fighters.some(f=>f.phase==='active')?1:combat.fighters.some(f=>f.phase==='windup')?.6:0);
        if(combat.done) audio.pause();
        const mode=el<HTMLSelectElement>('opponent').value;
        el('lesson').textContent=mode==='showcase'?'DÉMONSTRATION AUTOMATIQUE · LOURDE → PARADE → RIPOSTE':mode==='exercise'?(p.riposteUntil>combat.time?'1 · RIPOSTEZ MAINTENANT':e.phase==='windup'?(e.remaining<.15?'B · PAREZ !':'ATTENDEZ LA LAME…'):'EXERCICE · PAREZ LA PROCHAINE LOURDE'):'';
        updateHUD();
    }
    renderer.render(scene,camera);renderRequested=false;
});
void load();
