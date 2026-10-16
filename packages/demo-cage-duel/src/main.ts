import './style.css';
import { ArenaView } from './scene';
import { Action, Duel, TICK_SECONDS, ROUND_TICKS, attackAction, guardAction, type Direction } from './duel';
import { createAgent, createTraining, evaluate, type Evaluation } from './learning';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<main class="game lobby">
<div id="viewport"></div><div class="vignette"></div><div class="grain"></div>
<header><a class="brand" href="./">IGNITION <span> / THE CRUCIBLE</span></a><nav><button id="open-lab">ENTRAÎNEMENT</button><button id="sound" aria-pressed="false">SON OFF</button><button id="pause">PAUSE</button></nav></header>
<section class="hero" id="hero"><p class="eyebrow">SOUTE VII / DUEL EXPÉRIMENTAL</p><h1>LE FER.<br>LA FUREUR.</h1><div class="rule"></div><p class="hero-copy">Deux armures. Une cage.<br>Votre garde fait la différence.</p><button id="start" class="primary" disabled>PRÉPARATION DE L’ARÈNE…</button><p class="hero-note" id="loading">Chargement des modèles Blender</p><a class="atelier-link" href="./atelier.html">EXAMINER LES ARMURES ↗</a></section>
<div class="battle-hud"><div class="round"><span id="mode">DUEL EN COURS</span><strong id="timer">01:00</strong><small id="opponent-label">Adversaire de référence</small></div>
<div class="enemy-name"><span>II / VORREN</span><div class="health"><i id="hp1"></i></div><div class="stamina"><i id="sp1"></i></div></div>
<div id="guard" class="guard" aria-label="Garde directionnelle"><i data-guard="0" class="top selected"></i><i data-guard="1" class="left"></i><i data-guard="2" class="right"></i><span>◇</span></div>
<div class="fighter"><p class="eyebrow">I / FERROX</p><div class="health"><i id="hp0"></i></div><div class="stamina"><i id="sp0"></i></div><small>ENDURANCE</small></div>
<div class="combat-help"><span><kbd>↑ ← →</kbd> Direction de garde</span><span><kbd>CLIC / ESPACE</kbd> Frapper <kbd>CLIC DROIT / SHIFT</kbd> Parer</span><span><kbd>ZQSD</kbd> Déplacer · Verrouillage automatique</span></div></div>
<div id="impact" role="status"></div><div id="outcome" class="overlay" hidden><p class="eyebrow">FIN DU DUEL</p><h2 id="result"></h2><button id="rematch" class="primary">RETOURNER AU COMBAT</button></div>
<div id="pause-screen" class="overlay" hidden><p class="eyebrow">LE COMBAT VOUS ATTEND</p><h2>EN PAUSE.</h2><button id="resume" class="primary">REPRENDRE LE DUEL</button></div>
<footer><span>SOUTE 07 · LE CREUSET</span><span id="fps">— FPS</span></footer>
<div class="touch battle-hud"><button data-action="1">Avancer</button><button data-action="2">Reculer</button><button data-direction="1">←</button><button data-direction="0">↑</button><button data-direction="2">→</button><button data-action="5">Frapper</button><button data-action="6">Parer</button></div>
<dialog id="lab-dialog"><button id="close-lab" class="dialog-close" aria-label="Fermer l’entraînement">FERMER ×</button><section class="lab"><div class="lab-title"><p class="eyebrow">L’APPRENTISSAGE, POUR DE VRAI</p><h2>Personne ne naît<br><em>gladiateur.</em></h2><p>Entraînez une politique dans votre navigateur.<br>Puis entrez dans la cage pour l’affronter.</p></div><div class="training"><div class="training-top"><span class="eyebrow">IGNITION / Q-LEARNING</span><span id="training-state">PRÊT</span></div><p id="training-description">La référence suit des règles. Votre recrue apprend à partir des coups donnés, reçus et des résultats des duels.</p><div class="progress"><i id="progress"></i></div><div class="training-actions"><button id="train" class="secondary">ENTRAÎNER UNE RECRUE</button><button id="stop" class="quiet" hidden>ARRÊTER</button><label>Adversaire <select id="policy"><option value="reference">Référence · règles fixes</option></select></label></div><p id="report" role="status">60 000 transitions · Évaluation séparée sur 10 duels · Politique conservée jusqu’au rechargement.</p></div></section>
</dialog></main>`;
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
let roundAgent: ReturnType<typeof createAgent> | undefined;
let training = false, cancelTraining = false, sound = false, audio: AudioContext | undefined, impactUntil = 0;
const keys = new Set<string>();
const mouseButtons = new Set<number>();
let direction: Direction = 0;
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
const gameSurface = el("viewport");
gameSurface.tabIndex = 0;
gameSurface.setAttribute("aria-label", "Combat : ZQSD pour déplacer, flèches pour la direction, espace pour frapper, shift pour parer");
gameSurface.addEventListener('contextmenu', e => e.preventDefault());
gameSurface.addEventListener('mousedown', e => {
    if (!playing || paused || duel.done || labDialog.open) return;
    focusGame();
    if (e.button === 0) { pendingAction = attackAction(direction); mouseButtons.add(0); }
    if (e.button === 2) { pendingAction = guardAction(direction); mouseButtons.add(2); }
});
window.addEventListener('mouseup', e => { mouseButtons.delete(e.button); });
function focusGame(): void { gameSurface.focus({ preventScroll: true }); }
function reset(play: boolean, preservePause = false): void { document.querySelector('.game')!.classList.toggle('lobby', !play); el('pause-screen').hidden = true; const wasPaused = paused; generation++; duel = new Duel(17); roundAgent = selectedLearned() ? learned : undefined; playing = play; paused = false; keys.clear(); mouseButtons.clear(); touch = undefined; pendingAction = undefined; el('outcome').hidden = true; el('pause').textContent = 'PAUSE'; el('mode').textContent = play ? 'DUEL EN COURS' : 'DÉMONSTRATION'; el('opponent-label').textContent = selectedLearned() ? 'Politique apprise · figée' : play ? 'Adversaire de référence' : 'Adversaires de référence'; if (!preservePause) view.wide(); if (preservePause && wasPaused) pause(); }
function pause(): void { if (!playing || duel.done) return; paused = !paused; el('pause-screen').hidden = !paused; keys.clear(); mouseButtons.clear(); touch = undefined; pendingAction = undefined; el('pause').textContent = paused ? 'REPRENDRE' : 'PAUSE'; el('mode').textContent = paused ? 'EN PAUSE' : playing ? 'DUEL EN COURS' : 'DÉMONSTRATION'; }
function input(): Action {
    if (pendingAction !== undefined) {
        const action = pendingAction;
        pendingAction = undefined;
        return action === Action.Attack ? attackAction(direction) : action === Action.Guard ? guardAction(direction) : action;
    }
    if (touch !== undefined)
        return touch === Action.Attack ? attackAction(direction) : touch === Action.Guard ? guardAction(direction) : touch;
    if (keys.has('shift') || mouseButtons.has(2))
        return guardAction(direction);
    if (keys.has(' ') || mouseButtons.has(0))
        return attackAction(direction);
    if (keys.has('z') || keys.has('w'))
        return Action.Advance;
    if (keys.has('s'))
        return Action.Retreat;
    if (keys.has('q') || keys.has('a'))
        return Action.Left;
    if (keys.has('d'))
        return Action.Right;
    return Action.Idle;
}
el('start').onclick = () => { reset(true); focusGame(); };
el('rematch').onclick = () => { reset(true); focusGame(); };
el('pause').onclick = () => { pause(); focusGame(); };
el('resume').onclick = () => { pause(); focusGame(); };
const labDialog = el<HTMLDialogElement>('lab-dialog');
let resumeAfterLab = false;
el('open-lab').onclick = () => { resumeAfterLab = playing && !paused && !duel.done; if (resumeAfterLab) pause(); labDialog.showModal(); };
function closeLab(): void { labDialog.close(); if (resumeAfterLab && paused) pause(); focusGame(); }
el('close-lab').onclick = closeLab;
labDialog.addEventListener('cancel', e => { e.preventDefault(); closeLab(); });
view.ready.then(() => { el<HTMLButtonElement>('start').disabled = false; el('start').textContent = 'ENTRER DANS LA CAGE →'; el('loading').textContent = '100 % NAVIGATEUR · SOLO'; }).catch(() => { el('start').textContent = 'CHARGEMENT IMPOSSIBLE'; el('loading').textContent = 'Rechargez la page pour réessayer.'; });
function selectDirection(d: Direction): void { direction = d; }
document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(b => b.onclick = () => { selectDirection(Number(b.dataset.direction) as Direction); focusGame(); });
el('sound').onclick = () => { sound = !sound; el('sound').textContent = sound ? 'SON ON' : 'SON OFF'; el('sound').setAttribute('aria-pressed', String(sound)); tone('parry'); focusGame(); };
el('policy').onchange = () => { reset(playing); if (playing && !paused) pause(); };
window.addEventListener('keydown', e => {
    if (labDialog.open) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
        if (!e.repeat)
            pause();
        return;
    }
    if ((e.target as HTMLElement).matches('input,select,textarea,button') || !playing || paused || duel.done) return;
    if (k === 'arrowup' || k === 'arrowleft' || k === 'arrowright') { e.preventDefault(); selectDirection(k === 'arrowup' ? 0 : k === 'arrowleft' ? 1 : 2); return; }
    if ([' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'z', 'q', 's', 'd', 'w', 'a'].includes(k)) {
        e.preventDefault();
        keys.add(k);
        const commands: Record<string, Action> = { " ": attackAction(direction), shift: guardAction(direction), z: Action.Advance, w: Action.Advance, arrowup: Action.Advance, s: Action.Retreat, arrowdown: Action.Retreat, q: Action.Left, a: Action.Left, arrowleft: Action.Left, d: Action.Right, arrowright: Action.Right };
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
    if (!playing || paused || busy || duel.done || labDialog.open)
        return;
    busy = true;
    const run = generation;
    try {
        const action = roundAgent ? await roundAgent.getAction(duel.observe(1), true) : duel.reference(1);
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
                    reset(false, true); }, 1800);
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
        const option = choices.querySelector<HTMLOptionElement>('option[value=learned]')!;
        option.disabled = false;
        option.textContent = 'Recrue · politique apprise';
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
    const anchor = view.projectEnemy(duel);
    el('guard').style.left = `${anchor.x}%`;
    el('guard').style.top = `${anchor.y}%`;
    document.querySelectorAll<HTMLElement>('[data-guard]').forEach(g => {
        const d = Number(g.dataset.guard);
        g.classList.toggle('selected', d === direction);
        g.classList.toggle('incoming', duel.fighters[1].phase === 'windup' && d === duel.fighters[1].direction);
    });
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
