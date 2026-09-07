import './style.css';
import { ArenaView } from './scene';
import { Action, Duel, TICK_SECONDS, ROUND_TICKS } from './duel';
import { createAgent, createTraining, evaluate, type Evaluation } from './learning';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<header><a class="brand" href="#">IGNITION<span> / LABS</span></a><div class="edition">EXPERIMENT 009 <span>● LIVE IN YOUR BROWSER</span></div><button id="sound" class="quiet" aria-pressed="false">SON OFF</button></header>
<main>
<section class="heading"><div><p class="eyebrow">COMBAT INTELLIGENCE / BROWSER ARENA</p><h1>THE <em>CRUCIBLE.</em></h1></div><p class="intro">Forgé dans la cage.<br><span>Éprouvé au combat.</span></p></section>
<section class="stage" aria-label="Arène de duel">
<div id="viewport"></div><div class="vignette"></div>
<div class="hud"><div class="fighter"><span class="eyebrow">01 / VOTRE COMBATTANT</span><strong>FERROX</strong><div class="health"><i id="hp0"></i></div><div class="stamina"><i id="sp0"></i></div></div><div class="round"><span id="mode">DÉMONSTRATION</span><strong id="timer">01:00</strong><small id="opponent-label">Adversaires de référence</small></div><div class="fighter enemy"><span class="eyebrow">02 / ADVERSAIRE</span><strong>VORREN</strong><div class="health"><i id="hp1"></i></div><div class="stamina"><i id="sp1"></i></div></div></div>
<div id="impact" role="status"></div><div id="outcome" hidden><p class="eyebrow">FIN DU DUEL</p><h2 id="result"></h2><button id="rematch">REJOUER ↗</button></div>
<div class="stage-bottom"><span><i class="dot"></i> SOUTE 07 · CAGE DE COMBAT</span><div><button id="closeup" class="quiet">INSPECTER L’ARMURE</button><button id="wide" class="quiet">VUE DU DUEL</button><span id="fps">— FPS</span></div></div>
</section>
<section class="command"><div class="play"><button id="start" class="primary">ENTRER DANS LA CAGE <span>↗</span></button><button id="pause" class="secondary">PAUSE</button></div><div class="keyguide"><span><kbd>ZQSD</kbd> / <kbd>WASD</kbd> Déplacer</span><span><kbd>ESPACE</kbd> Frapper</span><span><kbd>SHIFT</kbd> Parer</span><span><kbd>ÉCHAP</kbd> Pause</span></div></section>
<div class="touch" aria-label="Commandes tactiles"><button data-action="1">Avancer</button><button data-action="2">Reculer</button><button data-action="3">Gauche</button><button data-action="4">Droite</button><button data-action="5">Frapper</button><button data-action="6">Parer</button></div>
<section class="lab"><div class="lab-title"><p class="eyebrow">L’APPRENTISSAGE, POUR DE VRAI</p><h2>Personne ne naît<br><em>gladiateur.</em></h2><p>Entraînez une politique dans votre navigateur.<br>Puis entrez dans la cage pour l’affronter.</p></div><div class="training"><div class="training-top"><span class="eyebrow">IGNITION / Q-LEARNING</span><span id="training-state">PRÊT</span></div><p id="training-description">La référence suit des règles. Votre recrue apprend à partir des coups donnés, reçus et des résultats des duels.</p><div class="progress"><i id="progress"></i></div><div class="training-actions"><button id="train" class="secondary">ENTRAÎNER UNE RECRUE</button><button id="stop" class="quiet" hidden>ARRÊTER</button><label>Adversaire <select id="policy"><option value="reference">Référence · règles fixes</option value="learned" disabled>Recrue · entraînement requis</option></select></label></div><p id="report" role="status">60 000 transitions · Évaluation séparée sur 10 duels · Politique conservée jusqu’au rechargement.</p></div></section>
<footer><span>UN DUEL. SEPT ACTIONS. UNE POLITIQUE À APPRENDRE.</span><span>MODÈLES ORIGINAUX PROCÉDURAUX · DÉMO EXPÉRIMENTALE</span></footer>
</main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let view: ArenaView;
try {
    view = new ArenaView(el('viewport'));
}
catch (error) {
    el('viewport').innerHTML = '<p class="render-error">Le rendu 3D nécessite WebGL. Essayez un navigateur avec accélération graphique.</p>';
    throw error;
}
let duel = new Duel(), playing = false, paused = false, busy = false, generation = 0, learned: ReturnType<typeof createAgent> | undefined;
let training = false, cancelTraining = false, sound = false, audio: AudioContext | undefined, impactUntil = 0;
const keys = new Set<string>();
let touch: Action | undefined;
let pendingAction: Action | undefined;
function tone(kind: string): void {
    if (!sound)
        return;
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kind === 'parry' ? 650 : 95, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, audio.currentTime + .16);
    gain.gain.setValueAtTime(.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .2);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + .21);
}
function selectedLearned(): boolean { return el<HTMLSelectElement>('policy').value === 'learned' && !!learned; }
function reset(play: boolean): void { (document.activeElement as HTMLElement)?.blur(); generation++; duel = new Duel(17); playing = play; paused = false; keys.clear(); touch = undefined; pendingAction = undefined; el('outcome').hidden = true; el('pause').textContent = 'PAUSE'; el('mode').textContent = play ? 'DUEL EN COURS' : 'DÉMONSTRATION'; el('opponent-label').textContent = selectedLearned() ? 'Politique apprise · figée' : play ? 'Adversaire de référence' : 'Adversaires de référence'; view.wide(); }
function pause(): void { paused = !paused; keys.clear(); touch = undefined; pendingAction = undefined; el('pause').textContent = paused ? 'REPRENDRE' : 'PAUSE'; el('mode').textContent = paused ? 'EN PAUSE' : playing ? 'DUEL EN COURS' : 'DÉMONSTRATION'; }
function input(): Action {
    if (pendingAction !== undefined) {
        const action = pendingAction;
        pendingAction = undefined;
        return action;
    }
    if (touch !== undefined)
        return touch;
    if (keys.has('shift'))
        return Action.Guard;
    if (keys.has(' '))
        return Action.Attack;
    if (keys.has('z') || keys.has('w') || keys.has('arrowup'))
        return Action.Advance;
    if (keys.has('s') || keys.has('arrowdown'))
        return Action.Retreat;
    if (keys.has('q') || keys.has('a') || keys.has('arrowleft'))
        return Action.Left;
    if (keys.has('d') || keys.has('arrowright'))
        return Action.Right;
    return Action.Idle;
}
el('start').onclick = () => reset(true);
el('rematch').onclick = () => reset(true);
el('pause').onclick = pause;
el('closeup').onclick = () => view.closeup();
el('wide').onclick = () => view.wide();
el('sound').onclick = () => { sound = !sound; el('sound').textContent = sound ? 'SON ON' : 'SON OFF'; el('sound').setAttribute('aria-pressed', String(sound)); tone('parry'); };
el('policy').onchange = () => reset(playing);
window.addEventListener('keydown', e => {
    if ((e.target as HTMLElement).matches('input,select,textarea,button'))
        return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
        if (!e.repeat)
            pause();
        return;
    }
    if ([' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'z', 'q', 's', 'd', 'w', 'a'].includes(k)) {
        e.preventDefault();
        keys.add(k);
        const commands: Record<string, Action> = { " ": Action.Attack, shift: Action.Guard, z: Action.Advance, w: Action.Advance, arrowup: Action.Advance, s: Action.Retreat, arrowdown: Action.Retreat, q: Action.Left, a: Action.Left, arrowleft: Action.Left, d: Action.Right, arrowright: Action.Right };
        pendingAction = commands[k];
    }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
const blur = () => { if (!paused)
    pause(); };
window.addEventListener('blur', blur);
document.addEventListener('visibilitychange', () => { if (document.hidden)
    blur(); });
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b => { b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); touch = Number(b.dataset.action); pendingAction = touch; }; const release = () => { touch = undefined; }; b.onpointerup = release; b.onpointercancel = release; b.onlostpointercapture = release; });
async function tick(): Promise<void> {
    if (paused || busy || duel.done)
        return;
    busy = true;
    const run = generation;
    try {
        const action = selectedLearned() ? await learned!.getAction(duel.observe(1), true) : duel.reference(1);
        if (run !== generation || paused)
            return;
        duel.step(playing ? input() : duel.reference(0), action);
        if (duel.events.length) {
            const e = duel.events[0];
            el('impact').textContent = e.kind === 'parry' ? 'PARADE · CONTRE OUVERT' : e.kind === 'block' ? 'GARDE' : 'IMPACT';
            impactUntil = performance.now() + 650;
            tone(e.kind);
        }
        if (duel.done) {
            if (!playing) {
                setTimeout(() => { if (run === generation && !playing)
                    reset(false); }, 1800);
            }
            else {
                const [a, b] = duel.fighters;
                el('result').textContent = a.health > b.health ? 'VICTOIRE.' : a.health < b.health ? 'DÉFAITE.' : 'ÉGALITÉ.';
                el('outcome').hidden = false;
                el('mode').textContent = 'DUEL TERMINÉ';
            }
        }
    }
    finally {
        busy = false;
    }
}
function summary(r: Evaluation): string { return `${r.wins} victoires / ${r.losses} défaites / ${r.draws} égalités`; }
el('stop').onclick = () => { cancelTraining = true; };
el('train').onclick = async () => {
    if (training)
        return;
    training = true;
    cancelTraining = false;
    el<HTMLButtonElement>('train').disabled = true;
    el('stop').hidden = false;
    const candidate = createAgent(), session = createTraining(candidate);
    try {
        el('training-state').textContent = 'ÉVALUATION INITIALE';
        const before = await evaluate(candidate);
        for (let count = 0; count < 60000 && !cancelTraining; count += 500) {
            for (let i = 0; i < 500; i++)
                await session.step();
            const progress = Math.round(session.stepCount / 600);
            el('progress').style.width = `${progress}%`;
            el('training-state').textContent = `${progress}%`;
            el('report').textContent = `${session.stepCount.toLocaleString('fr')} transitions · ${candidate.tableSize} états visités`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (cancelTraining) {
            el('training-state').textContent = 'ARRÊTÉ';
            el('report').textContent = 'Session interrompue. Votre précédent adversaire reste disponible.';
            return;
        }
        el('training-state').textContent = 'ÉVALUATION FINALE';
        const after = await evaluate(candidate);
        const choices = el<HTMLSelectElement>('policy');
        if (!choices.querySelector('option[value=learned]'))
            choices.add(new Option('Recrue · politique apprise', 'learned'));
        learned = candidate;
        el('training-state').textContent = 'RECRUE DISPONIBLE';
        el('training-description').textContent = 'Entraînement terminé. Sélectionnez « Recrue » pour affronter cette politique figée.';
        el('report').textContent = `Avant : ${summary(before)}. Après : ${summary(after)}. Test contre la référence, pas contre des joueurs humains.`;
    }
    catch (error) {
        el('training-state').textContent = 'ERREUR';
        el('report').textContent = error instanceof Error ? error.message : String(error);
    }
    finally {
        training = false;
        el<HTMLButtonElement>('train').disabled = false;
        el('stop').hidden = true;
    }
};
let last = performance.now(), accumulator = 0;
function frame(now: number): void {
    const dt = Math.min(.1, (now - last) / 1000);
    last = now;
    accumulator += dt;
    const interval = playing ? TICK_SECONDS : TICK_SECONDS * 1.6;
    if (accumulator >= interval) {
        accumulator -= interval;
        void tick();
    }
    view.render(duel, now / 1000);
    for (let i = 0; i < 2; i++) {
        el('hp' + i).style.width = `${duel.fighters[i].health}%`;
        el('sp' + i).style.width = `${duel.fighters[i].stamina}%`;
    }
    const seconds = Math.max(0, Math.ceil((ROUND_TICKS - duel.tick) * TICK_SECONDS));
    el('timer').textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    el('fps').textContent = `${view.fps} FPS`;
    if (now > impactUntil)
        el('impact').textContent = '';
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
