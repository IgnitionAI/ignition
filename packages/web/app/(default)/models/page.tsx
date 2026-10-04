import type { Metadata } from 'next'
import CheckpointGallery from '@/components/checkpoint-gallery'
import catalogue from '@/data/checkpoints.json'
import { checkpointCatalogSchema } from '../../../../storage/src/catalog'

export const metadata: Metadata = {
  title: 'Checkpoints vérifiés',
  description: 'Découvrez les politiques SAC avec contrats versionnés, preuves et résultats ; chargez une copie compatible dans le laboratoire.',
}
export default function ModelsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-32 pb-20 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wider text-indigo-300">IgnitionAI · modèles et preuves</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Un checkpoint, son contrat, ses résultats.</h1>
      <p className="mt-6 mb-10 max-w-3xl text-lg leading-relaxed text-slate-300">Cinq politiques SAC entraînées sur la même petite tâche physique. Chaque modèle conserve sa graine, son protocole et ses limites. Vérifiez une copie dans le laboratoire avant de l’utiliser ; ces résultats ne constituent pas un classement entre environnements.</p>
      <CheckpointGallery initial={checkpointCatalogSchema.parse(catalogue)} />
    </section>
  )
}
