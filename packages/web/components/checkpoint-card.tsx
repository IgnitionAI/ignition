import { getCheckpointArtifactURL, type CheckpointEntry } from '../../storage/src/catalog'

export default function CheckpointCard({ model, selected, onSelect }: {
  model: CheckpointEntry; selected: boolean; onSelect: () => void
}) {
  const action = model.contract.action
  return (
    <article className={`rounded-2xl border p-6 ${selected ? 'border-indigo-400 bg-indigo-950/40' : 'border-slate-700 bg-slate-900/70'}`}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">{model.name}</h2>
        <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-sm text-indigo-200">{model.contract.algorithm.toUpperCase()}</span>
      </div>
      <p className="mt-3 text-slate-300">{model.contract.environment.id} · v{model.contract.environment.version}</p>
      <p className="mt-5 text-3xl font-semibold text-white">{model.evaluation.successes}/{model.evaluation.episodes} <span className="text-sm font-normal text-slate-300">épisodes réussis</span></p>
      {model.evaluation.meanCost !== undefined && <p className="mt-2 text-slate-300">Coût moyen : {model.evaluation.meanCost.toFixed(3)}</p>}
      <p className="mt-2 break-words text-sm text-slate-400">Protocole : {model.evaluation.protocol}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-slate-400">Interactions</dt><dd className="text-slate-200">{model.provenance.samples.toLocaleString('fr-FR')}</dd>
        <dt className="text-slate-400">Mises à jour</dt><dd className="text-slate-200">{model.provenance.updates.toLocaleString('fr-FR')}</dd>
        <dt className="text-slate-400">Backend</dt><dd className="text-slate-200">{model.provenance.backend}</dd>
        <dt className="text-slate-400">Licence déclarée</dt><dd><a className="text-indigo-300 underline" href={model.license.source} target="_blank" rel="noreferrer">{model.license.id}</a></dd>
      </dl>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-indigo-300">
        <a className="underline" href={model.evaluation.protocolSource} target="_blank" rel="noreferrer">Protocole</a>
        <a className="underline" href={model.evaluation.report} target="_blank" rel="noreferrer">Rapport brut</a>
        <a className="underline" href={model.provenance.source} target="_blank" rel="noreferrer">Preuves et source</a>
      </div>
      <details className="mt-5 text-sm text-slate-300">
        <summary className="cursor-pointer text-slate-200">Contrat, empreinte et limites</summary>
        <p className="mt-3">Observations : {model.contract.observation.id} v{model.contract.observation.version}, {model.contract.observation.shape[0]} valeurs.</p>
        <p className="mt-2">Actions : {action.id} v{action.version}, {action.kind === 'box' ? `${action.shape[0]} valeurs, bornes ${action.low.join(', ')} à ${action.high.join(', ')}` : `${action.count} choix discrets`}.</p>
        <p className="mt-2">Format : {model.contract.checkpointFormat} · Source : {model.artifact.source.type === 'local' ? 'fichier intégré' : `HF ${model.artifact.source.repoId}`}.</p>
        <p className="mt-2">Commit : <code>{model.provenance.sourceCommit.slice(0, 12)}</code> · {model.provenance.createdAt.slice(0, 10)}.</p>
        <p className="mt-2 break-all">SHA-256 : <code>{model.artifact.sha256}</code></p>
        <p className="mt-2">{model.license.note}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">{model.limits.map(limit => <li key={limit}>{limit}</li>)}</ul>
      </details>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button className="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300" onClick={onSelect} aria-pressed={selected}>Vérifier et charger</button>
        <a className="text-sm text-indigo-300 underline" href={getCheckpointArtifactURL(model)} download={`${model.id}.json`}>Télécharger JSON</a>
      </div>
    </article>
  )
}
