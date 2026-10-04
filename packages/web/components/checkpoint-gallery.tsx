'use client'

import { useEffect, useRef, useState } from 'react'
import { checkpointCatalogSchema, type CheckpointCatalog, type CheckpointEntry } from '../../storage/src/catalog'
import CheckpointCard from './checkpoint-card'

export default function CheckpointGallery({ initial }: { initial: CheckpointCatalog }) {
  const [catalogue, setCatalogue] = useState(initial)
  const [imported, setImported] = useState(false)
  const [selected, setSelected] = useState<CheckpointEntry | null>(null)
  const [status, setStatus] = useState('Choisissez un checkpoint pour le vérifier dans le laboratoire.')
  const [error, setError] = useState('')
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const data: unknown = event.data
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow
        || !data || typeof data !== 'object' || !('type' in data) || data.type !== 'ignition:checkpoint-status'
        || !('state' in data) || !('detail' in data) || typeof data.detail !== 'string') return
      if (data.state === 'loaded') { setStatus(data.detail); setError('') }
      if (data.state === 'error') { setStatus('Checkpoint refusé.'); setError(data.detail.slice(0, 2000)) }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])

  function select(entry: CheckpointEntry) {
    setError(''); setStatus(`Vérification de ${entry.name}…`)
    if (selected?.id === entry.id && selected.artifact.sha256 === entry.artifact.sha256
      && JSON.stringify(selected.artifact.source) === JSON.stringify(entry.artifact.source)) {
      frame.current?.contentWindow?.postMessage({ type: 'ignition:load-checkpoint', entry }, window.location.origin)
    } else setSelected(entry)
  }
  async function importCatalogue(input: HTMLInputElement) {
    const file = input.files?.[0]
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('Le catalogue dépasse la limite de 1 Mo.')
      const parsed = checkpointCatalogSchema.parse(JSON.parse(await file.text()))
      setCatalogue(parsed); setImported(true); setSelected(null); setError('')
      setStatus('Catalogue importé. Les résultats sont déclarés par son auteur ; vérifiez le rapport lié.')
    } catch {
      setError('Catalogue invalide. Vérifiez le format v1, les contrats, empreintes, licences et protocoles. Le catalogue actuel est conservé.')
    } finally { input.value = '' }
  }
  function restoreCatalogue() {
    setCatalogue(initial); setImported(false); setSelected(null); setError('')
    setStatus('Catalogue intégré restauré. Choisissez un checkpoint.')
  }

  return (
    <>
      <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <p className="text-slate-200">{imported ? 'Catalogue importé · résultats déclarés' : 'Catalogue intégré · cinq graines vérifiées, sans sélection du meilleur modèle'}</p>
        <p className="mt-3 text-sm text-slate-400">Le laboratoire prend en charge SAC sur point-mass-v1. Les dimensions et versions sont vérifiées avant le chargement. Les fichiers HF doivent être publics, avec une révision complète et une empreinte SHA-256. Aucun jeton n’est demandé.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="text-sm text-slate-200" htmlFor="catalog-import">Importer un catalogue JSON
            <input id="catalog-import" className="mt-2 block max-w-full text-sm text-slate-300" type="file" accept="application/json,.json" onChange={event => { void importCatalogue(event.currentTarget) }} />
          </label>
          {imported && <button className="text-sm text-indigo-300 underline" onClick={restoreCatalogue}>Revenir au catalogue intégré</button>}
          <a className="text-sm text-indigo-300 underline" href="/models/catalog.json" download="ignition-checkpoint-catalog.json">Télécharger le catalogue v1</a>
        </div>
      </div>
      <p role="status" className="mb-4 text-slate-200">{status}</p>
      {error && <p role="alert" className="mb-6 whitespace-pre-wrap break-words rounded-lg border border-red-400/50 bg-red-950/40 p-4 text-red-200">{error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {catalogue.models.map(model => <CheckpointCard key={model.id} model={model} selected={selected?.id === model.id} onSelect={() => select(model)} />)}
      </div>
      {selected && <section className="mt-12" aria-label="Laboratoire du checkpoint">
        <h2 className="text-2xl font-semibold text-white">Laboratoire · {selected.name}</h2>
        <p className="mt-3 mb-6 text-slate-300">L’inférence et les tests gardent les poids figés. Entraîner modifie uniquement cette copie locale. Le test rapide de 20 épisodes reste distinct du protocole publié.</p>
        <iframe key={selected.artifact.sha256 + JSON.stringify(selected.artifact.source)} ref={frame} title={`Laboratoire ${selected.name}`} src="/models/lab/index.html"
          className="h-[1720px] md:h-[1120px] w-full rounded-2xl border border-slate-700 bg-slate-900"
          onLoad={() => frame.current?.contentWindow?.postMessage({ type: 'ignition:load-checkpoint', entry: selected }, window.location.origin)} />
      </section>}
    </>
  )
}
