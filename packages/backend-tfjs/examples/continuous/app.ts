import * as tf from '@tensorflow/tfjs';
import { ContinuousRunner } from '@ignitionai/core';
import { SACAgent } from '../../src/agents/sac';
import { sacCheckpointSchema } from '../../src/sac/checkpoint';
import { PointMassEnv } from './point-mass';

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element ${id}`);
  return node as T;
}
const canvas = element<HTMLCanvasElement>('world'), context = canvas.getContext('2d');
const status = element('status'), metrics = element('metrics'), error = element('error');
const progress = element<HTMLProgressElement>('progress');
const buttons = ['train', 'infer', 'evaluate', 'reset', 'save', 'load', 'download'];
const file = element<HTMLInputElement>('file'), stop = element<HTMLButtonElement>('stop');
const storageKey = 'ignition:sac:point-mass-v1';
let env: PointMassEnv, agent: SACAgent, runner: ContinuousRunner;
let busy = false, stopped = false;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function draw(state: number[] = env.observe(), action?: number): void {
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#a5b4fc'; context.fillRect(445, 35, 10, 120);
  context.strokeStyle = '#64748b'; context.beginPath(); context.moveTo(50, 125); context.lineTo(850, 125); context.stroke();
  context.fillStyle = '#fbbf24'; context.beginPath(); context.arc(450 + state[0] * 125, 115, 14, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#e5e7eb'; context.font = '18px system-ui';
  context.fillText(`Position ${state[0].toFixed(3)} · Vitesse ${state[1].toFixed(3)}${action === undefined ? '' : ` · Action ${action.toFixed(3)}`}`, 30, 185);
}
function update(): void { metrics.textContent = JSON.stringify(agent.getState(), null, 2); }
function controls(): void {
  buttons.forEach(id => { element<HTMLButtonElement>(id).disabled = busy; });
  file.disabled = busy; stop.disabled = !busy;
}
async function operation(work: () => Promise<void>): Promise<void> {
  if (busy) return;
  busy = true; stopped = false; error.textContent = ''; controls();
  try { await work(); } catch (failure) { error.textContent = String(failure); status.textContent = 'Opération interrompue par une erreur.'; }
  finally { busy = false; controls(); update(); }
}
async function replace(next: SACAgent): Promise<void> {
  if (runner) await runner.stop();
  agent?.dispose(); agent = next;
  env = new PointMassEnv(agent.settings.seed); runner = new ContinuousRunner(env, agent);
  progress.value = 0; update(); draw();
}
function record(): { environment: string; checkpoint: ReturnType<SACAgent['exportCheckpoint']> } {
  return { environment: 'point-mass-v1', checkpoint: agent.exportCheckpoint() };
}
async function restore(raw: unknown): Promise<void> {
  if (!raw || typeof raw !== 'object' || !('environment' in raw) || raw.environment !== 'point-mass-v1'
    || !('checkpoint' in raw)) throw new Error('Checkpoint incompatible avec point-mass-v1');
  const checkpoint = sacCheckpointSchema.parse(raw.checkpoint);
  if (checkpoint.settings.inputSize !== 2 || JSON.stringify(checkpoint.low) !== '[-2]'
    || JSON.stringify(checkpoint.high) !== '[2]') throw new Error('Dimensions ou bornes incompatibles');
  const next = new SACAgent({ ...checkpoint.settings, actionSpace: env.actionSpace });
  try { next.loadCheckpoint(checkpoint); } catch (failure) { next.dispose(); throw failure; }
  await replace(next);
  status.textContent = 'Checkpoint rechargé. Optimiseur et replay recréés.';
}

element('train').onclick = () => { void operation(async () => {
  status.textContent = 'Apprentissage SAC en cours…';
  for (let step = 0; step < 20000 && !stopped; step++) {
    const result = await runner.step(); progress.value = step + 1;
    if (step % 16 === 0) { draw(result.observation, result.action[0]); update(); await pause(0); }
  }
  status.textContent = stopped ? 'Entraînement arrêté. Les poids sont conservés.' : 'Budget atteint. Évaluez la politique avant de conclure.';
}); };
stop.onclick = () => { stopped = true; };
element('infer').onclick = () => { void operation(async () => {
  const test = new PointMassEnv(211); status.textContent = 'Inférence gloutonne sans apprentissage.';
  while (!test.terminated() && !test.truncated() && !stopped) {
    const action = await agent.getAction(test.observe(), true); test.step(action); draw(test.observe(), action[0]); await pause(50);
  }
  status.textContent = stopped ? 'Inférence arrêtée.' : `Épisode fini · ${test.success ? 'réussi' : 'non réussi'} · ${test.steps} étapes.`;
}); };
element('evaluate').onclick = () => { void operation(async () => {
  const before = JSON.stringify(agent.exportCheckpoint()), test = new PointMassEnv(211);
  let successes = 0, cost = 0, completed = 0;
  for (let episode = 0; episode < 20 && !stopped; episode++) {
    if (episode > 0) test.reset();
    while (!test.terminated() && !test.truncated()) {
      const action = await agent.getAction(test.observe(), true); test.step(action); cost -= test.reward();
    }
    if (test.success) successes++; completed++;
    draw(test.observe()); status.textContent = `${completed}/20 épisodes évalués · ${successes} réussites.`; await pause(0);
  }
  if (before !== JSON.stringify(agent.exportCheckpoint())) throw new Error('Évaluation a modifié le checkpoint');
  status.textContent = `${successes}/${completed} épisodes réussis · coût moyen ${completed ? (cost / completed).toFixed(2) : 'non mesuré'} · poids figés.`;
}); };
element('save').onclick = () => { void operation(async () => {
  localStorage.setItem(storageKey, JSON.stringify(record())); status.textContent = 'Checkpoint sauvegardé dans ce navigateur.';
}); };
element('load').onclick = () => { void operation(async () => {
  const json = localStorage.getItem(storageKey); if (!json) throw new Error('Aucune sauvegarde locale');
  await restore(JSON.parse(json));
}); };
element('reset').onclick = () => { void operation(async () => {
  await replace(new SACAgent({ inputSize: 2, actionSpace: env.actionSpace, seed: 11 })); status.textContent = 'Nouvelle politique, graine 11.';
}); };
element('download').onclick = () => { void operation(async () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(record())], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'sac-point-mass.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'Export JSON demandé.';
}); };
file.onchange = () => { const selected = file.files?.[0]; if (selected) void operation(async () => { await restore(JSON.parse(await selected.text())); }); };

async function initialize(): Promise<void> {
  await tf.setBackend('cpu'); await tf.ready(); env = new PointMassEnv(11);
  await replace(new SACAgent({ inputSize: 2, actionSpace: env.actionSpace, seed: 11 }));
  status.textContent = 'CPU prêt. Politique initiale, aucune compétence mesurée.'; controls();
}
initialize().catch(failure => { error.textContent = String(failure); });
