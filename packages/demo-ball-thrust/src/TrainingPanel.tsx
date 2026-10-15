import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { TrainingSession, SessionSnapshot } from './training-session';

const MODE_LABELS = { manual: 'Manuel', training: 'Entraînement', inference: 'Inférence — poids figés', paused: 'En pause' };

/** Renders real session counters and serialized training, checkpoint and inference controls. */
export function TrainingPanel({ session, snapshot: state }: { session: TrainingSession; snapshot: SessionSnapshot }) {
  const [commandError, setCommandError] = useState('');
  const invoke = (operation: () => Promise<unknown>) => {
    setCommandError('');
    void operation().catch((reason: unknown) => setCommandError(reason instanceof Error ? reason.message : String(reason)));
  };
  const returns = state.recentEpisodes.map((episode) => episode.return);
  const minimum = Math.min(0, ...returns);
  const spread = Math.max(1, ...returns) - minimum;
  const points = returns.map((value, index) => `${index / Math.max(1, returns.length - 1) * 600},${82 - (value - minimum) / spread * 74}`).join(' ');
  const latest = state.recentEpisodes.at(-1);
  const error = commandError || state.error;
  return <section className="panel learning" aria-label="Entraînement DQN">
    <div className="learning-heading"><div><p className="eyebrow">RÉSEAU DE NEURONES / DQN</p>
      <h2>21 <span>→</span> 32 <span>→</span> 32 <span>→</span> 9</h2></div>
      <p className="mode" data-testid="mode" role="status">{state.busy ? 'Opération en cours…' : MODE_LABELS[state.mode]}</p></div>
    <div className="actions">
      <button data-testid="train" disabled={state.busy || state.budgetReached} onClick={() => invoke(() => session.start('training'))}>Entraîner / reprendre</button>
      <button data-testid="pause" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.pause())}>Pause</button>
      <button data-testid="inference" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.start('inference'))}>Inférence</button>
      <button data-testid="manual" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.start('manual'))}>Manuel</button>
    </div>
    <dl className="learning-stats">
      <div><dt>Transitions entraînement</dt><dd data-testid="train-steps">{state.trainingSteps} / 4096</dd></div>
      <div><dt>Mises à jour réseau</dt><dd data-testid="updates">{state.updates}</dd></div>
      <div><dt>Exploration ε</dt><dd data-testid="epsilon">{state.epsilon.toFixed(4)}</dd></div>
      <div><dt>Transitions inférence</dt><dd data-testid="infer-steps">{state.inferenceSteps}</dd></div>
      <div><dt>Épisodes entraînement</dt><dd data-testid="episodes">{state.trainingEpisodes}</dd></div>
      <div><dt>Succès entraînement</dt><dd data-testid="successes">{state.trainingSuccesses}</dd></div>
      <div><dt>Empreinte des poids</dt><dd data-testid="weight-fingerprint">{state.fingerprint}</dd></div>
      <div><dt>Poids modifiés depuis création</dt><dd data-testid="weights-changed">{state.changedWeights ? 'Oui' : 'Non'}</dd></div>
    </dl>
    <p>{state.parameterCount.toLocaleString('fr-FR')} paramètres · backend <b data-testid="backend">{tf.getBackend()}</b> · <span data-testid="tensors">{tf.memory().numTensors}</span> tenseurs actifs. Pas de loss inventée : les retours ci-dessous sont ceux des épisodes réels.</p>
    <div className="reward-chart"><p>Retours d’épisodes{latest ? ` · dernier : ${latest.return.toFixed(2)} (${latest.outcome})` : ' · aucun épisode terminé'}</p>
      {returns.length > 1 ? <svg viewBox="0 0 600 90" role="img" aria-label="Retours cumulés des derniers épisodes d’entraînement"><polyline points={points} fill="none" stroke="#64d9eb" strokeWidth="2" /></svg> : <p>La courbe apparaît après deux épisodes ; un retour plus élevé ne garantit pas que la cible est atteinte.</p>}</div>
    <div className="actions">
      <button data-testid="save" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.save())}>Sauvegarder localement</button>
      <button data-testid="load" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.load())}>Charger</button>
      <button data-testid="evaluate" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.evaluate())}>Évaluer les 3 politiques</button>
      <button data-testid="new-network" className="secondary" disabled={state.busy} onClick={() => invoke(() => session.newNetwork())}>Nouveau réseau</button>
    </div>
    <p>Checkpoint dans ce navigateur : réseau et compteurs, pas le replay. Un nouvel épisode conserve l’agent ; « Nouveau réseau » repart de poids initiaux. L’évaluation ne fait aucune mise à jour.</p>
    {(state.notice || state.budgetReached) && <p role="status" data-testid="notice">{state.notice || 'Budget de 4096 transitions atteint. Évaluez le réseau ou lancez l’inférence.'}</p>}
    {error && <p role="alert">{error}</p>}
    {state.evaluation && <div className="evaluation">
      <h3>Évaluation séparée — 8 graines inédites</h3>
      <p>Au plus 300 actions par épisode. Réseau initial et final en greedy ; baseline aléatoire semée. Zéro succès reste un résultat possible, pas une convergence.</p>
      <div className="table-scroll"><table data-testid="evaluation-table"><thead><tr><th>Politique</th><th>Retour moyen</th><th>Succès</th></tr></thead><tbody>
        {(['initial', 'trained', 'random'] as const).map((policy) => <tr key={policy}>
          <th>{({ initial: 'Réseau initial', trained: 'Réseau actuel', random: 'Aléatoire' })[policy]}</th>
          <td>{state.evaluation![policy].meanReturn.toFixed(3)}</td><td>{(state.evaluation![policy].successRate * 100).toFixed(1)} %</td>
        </tr>)}
      </tbody></table></div>
      <details><summary>Résultats bruts et graines</summary><pre data-testid="evaluation-json">{JSON.stringify(state.evaluation, null, 2)}</pre></details>
    </div>}
  </section>;
}
