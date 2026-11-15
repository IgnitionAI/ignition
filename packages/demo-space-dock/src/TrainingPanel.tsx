import { useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { DQN_CONFIG, SESSION_DEFAULTS } from './training-session';
import type { SessionSnapshot, TrainingSession } from './training-session';
import { TRAINING_ENV } from './dock-training-env';

const MODE_LABELS = {
  idle: 'Réseau à l’arrêt — manuel / PD actifs',
  training: 'Entraînement DQN (exploration ε)',
  inference: 'Regarder l’agent — poids figés, sans exploration',
  paused: 'En pause',
} as const;
const OUTCOMES = { success: 'arrimé', collision: 'collision', bounds: 'hors limites', nonfinite: 'non fini', timeout: 'temps écoulé' } as const;
const percent = (value: number | null) => value === null ? '—' : `${(value * 100).toFixed(0)} %`;

/** Live counters of the real session; nothing here is estimated or pre-recorded. */
export function TrainingPanel({ session, snapshot: state }: { session: TrainingSession; snapshot: SessionSnapshot }) {
  const [commandError, setCommandError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const invoke = (operation: () => Promise<unknown>) => {
    setCommandError('');
    void operation().catch((reason: unknown) => setCommandError(reason instanceof Error ? reason.message : String(reason)));
  };
  const download = () => invoke(async () => {
    const blob = new Blob([await session.exportModel()], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `space-dock-dqn-${state.trainingSteps}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
  // The shipped weights stay out of the main bundle until the visitor asks for them.
  const loadPretrained = () => invoke(async () => {
    const { default: file } = await import('./pretrained/space-dock-dqn.json');
    await session.importModel(JSON.stringify(file), { pretrained: true });
  });
  const upload = (input: HTMLInputElement) => {
    const chosen = input.files?.[0]; input.value = '';
    if (chosen) invoke(async () => session.importModel(await chosen.text()));
  };
  const curve = state.curve, low = Math.min(0, ...curve), spread = Math.max(1, ...curve) - low;
  const points = curve.map((value, index) => `${(index / Math.max(1, curve.length - 1) * 600).toFixed(1)},${(84 - (value - low) / spread * 76).toFixed(1)}`).join(' ');
  const zero = 84 - (0 - low) / spread * 76;
  const latest = state.recentEpisodes.at(-1);
  const running = state.mode === 'training' || state.mode === 'inference';
  const error = commandError || state.error;
  const layers = [DQN_CONFIG.inputSize, ...(DQN_CONFIG.hiddenLayers ?? []), DQN_CONFIG.actionSize];
  return <section className="learning" aria-label="Entraînement DQN">
    <div className="learning-heading">
      <div><p className="eyebrow">RÉSEAU DE NEURONES / DQN · TF.js {tf.getBackend()}</p><h2>{layers.join(' → ')}</h2></div>
      <p role="status" data-testid="session-mode">{state.busy ? 'Opération en cours…' : MODE_LABELS[state.mode]}</p>
    </div>
    <div className="toolbar">
      <button data-testid="train" disabled={state.busy || state.mode === 'training'} onClick={() => invoke(() => session.train())}>
        {state.mode === 'paused' && state.resumeMode === 'training' ? 'Reprendre l’entraînement' : state.trainingSteps ? 'Continuer l’entraînement' : 'Démarrer l’entraînement'}</button>
      <button data-testid="pause" disabled={state.busy || !running} onClick={() => invoke(() => session.pause())}>Pause</button>
      <button data-testid="watch" disabled={state.busy || state.mode === 'inference'} onClick={() => invoke(() => session.watch())}>Regarder l’agent</button>
      <button data-testid="stop" disabled={state.busy || state.mode === 'idle'} onClick={() => invoke(() => session.stop())}>Rendre la main (manuel / PD)</button>
      <button data-testid="reset-network" disabled={state.busy} onClick={() => invoke(() => session.reset())}>Réinitialiser le réseau</button>
      <label>Cadence <select data-testid="cadence" value={state.chunkMs} onChange={event => session.setChunkBudget(Number(event.currentTarget.value))}>
        <option value={SESSION_DEFAULTS.chunkMs}>Fluide ({SESSION_DEFAULTS.chunkMs} ms par tranche)</option>
        <option value={SESSION_DEFAULTS.fastChunkMs}>Rapide ({SESSION_DEFAULTS.fastChunkMs} ms, rendu moins fluide)</option>
      </select></label>
    </div>
    <dl className="metrics">
      <div><dt>Pas d’entraînement</dt><dd data-testid="train-steps">{state.trainingSteps.toLocaleString('fr-FR')}</dd></div>
      <div><dt>Épisodes d’entraînement</dt><dd data-testid="episodes">{state.episodes}</dd></div>
      <div><dt>Taux d’arrimage ({SESSION_DEFAULTS.successWindow} derniers)</dt><dd data-testid="success-recent">{percent(state.recentSuccessRate)}</dd></div>
      <div><dt>Taux d’arrimage global</dt><dd data-testid="success-rate">{percent(state.successRate)} <small>({state.successes}/{state.episodes})</small></dd></div>
      <div><dt>Exploration ε</dt><dd data-testid="epsilon">{state.epsilon.toFixed(3)}</dd></div>
      <div><dt>Mises à jour du réseau</dt><dd data-testid="updates">{state.updates}</dd></div>
      <div><dt>Perte (dernier lot)</dt><dd data-testid="loss">{state.lastLoss === null ? '—' : state.lastLoss.toExponential(2)}</dd></div>
      <div><dt>Épisode en cours</dt><dd data-testid="episode-now">{state.episodeSteps} / {TRAINING_ENV.maxSteps} pas · {state.episodeReturn.toFixed(2)}</dd></div>
      <div><dt>Agent regardé</dt><dd data-testid="inference">{state.inferenceSteps} pas · {state.inferenceSuccesses}/{state.inferenceEpisodes} arrimés</dd></div>
    </dl>
    <div className="reward-chart">
      <p>Récompense moyenne (fenêtre glissante de {SESSION_DEFAULTS.curveWindow} épisodes){latest ? ` · dernier épisode : ${latest.return.toFixed(2)}, ${OUTCOMES[latest.outcome]}` : ' · aucun épisode terminé'}</p>
      {curve.length > 1
        ? <svg viewBox="0 0 600 90" role="img" aria-label={`Récompense moyenne glissante sur ${curve.length} épisodes, dernière valeur ${curve.at(-1)!.toFixed(2)}`}>
          <line x1="0" x2="600" y1={zero} y2={zero} stroke="#425667" strokeDasharray="4 4" />
          <polyline points={points} fill="none" stroke="#8ee8cc" strokeWidth="2" /></svg>
        : <p>La courbe apparaît après deux épisodes terminés.</p>}
    </div>
    <div className="toolbar">
      <button data-testid="pretrained" disabled={state.busy} onClick={loadPretrained}>Charger un agent pré-entraîné</button>
      <button data-testid="export" disabled={state.busy} onClick={download}>Exporter le modèle (JSON TF.js)</button>
      <button data-testid="import" disabled={state.busy} onClick={() => file.current?.click()}>Importer un modèle</button>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={event => upload(event.currentTarget)} />
    </div>
    {state.notice && <p role="status">{state.notice}</p>}
    {state.provenance && <p data-testid="provenance">Agent entraîné hors ligne par IgnitionAI, avec cette même démo en Node.js sans rendu :
      {' '}{state.provenance.trainingSteps.toLocaleString('fr-FR')} pas DQN (graine {state.provenance.seed}
      {state.provenance.curriculum ? `, départs d’entraînement entre ${state.provenance.curriculum[0].toLocaleString('fr-FR')} et ${state.provenance.curriculum[1].toLocaleString('fr-FR')} m` : ''}).
      {' '}Mesure greedy avant publication : {Math.round(state.provenance.evaluation.successRate * state.provenance.evaluation.episodes)}/{state.provenance.evaluation.episodes} arrimages
      {' '}depuis le départ standard (graines à partir de {state.provenance.evaluation.firstSeed}), distance finale moyenne {state.provenance.evaluation.meanFinalDistance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m.
      {' '}Recette : commit {state.provenance.commit}, {state.provenance.date}. Cliquez « Regarder l’agent » pour le voir piloter ; « Réinitialiser le réseau » repart de zéro pour l’entraîner vous-même.</p>}
    {state.nonFiniteLosses > 0 && <p role="alert">Perte non finie observée {state.nonFiniteLosses} fois : réinitialisez le réseau.</p>}
    {error && <p role="alert">{error}</p>}
    <details><summary>Ce que fait l’entraînement</summary>
      <p>Le réseau reçoit les 26 observations normalisées du dock et choisit l’une des 8 actions toutes les 0,1 s simulées.
        Récompense par pas : variation d’un potentiel (distance au poste, alignement du lacet, vitesse près du poste) moins un léger coût de temps,
        bornée à [−1, 1] ; −1 par contact ; +10 à l’arrimage ; −10 en cas de collision ou de sortie des limites.
        Un épisode dure au plus {TRAINING_ENV.maxSteps} décisions ({TRAINING_ENV.maxSteps / 10} s simulées).</p>
      <p>Curriculum : pendant l’entraînement, chaque épisode part à l’arrêt sur l’axe du poste, à une distance tirée
        {state.curriculum ? ` entre ${state.curriculum[0].toLocaleString('fr-FR')} et ${state.curriculum[1].toLocaleString('fr-FR')} m` : ''}.
        « Regarder l’agent » part toujours du départ standard. Le critère d’arrimage ne change pas.</p>
      <p>Le calcul tourne dans ce navigateur, sur le processeur, par tranches de {SESSION_DEFAULTS.chunkMs} ms pour laisser la scène s’afficher.
        Aucune convergence n’est garantie : la courbe et les taux affichés sont ceux des épisodes réellement joués ici. L’agent pré-entraîné est un résultat mesuré hors ligne, pas une promesse pour votre propre entraînement.
        L’export contient les poids du réseau, pas le replay ni l’état de l’optimiseur.</p>
    </details>
  </section>;
}
