import Image from 'next/image'
import Link from 'next/link'
import { cartpoleArticle } from '@/lib/blog'

export const metadata = {
  title: 'Blog',
  description: 'Des tutoriels concrets pour construire et entraîner des agents avec Ignition.',
}

export default function BlogPage() {
  return (
    <section lang="fr" className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24">
      <p className="text-indigo-400 mb-3">Le blog Ignition</p>
      <h1 className="h1 mb-4">Apprendre en construisant</h1>
      <p className="text-lg text-slate-400 mb-12">Des expériences reproductibles, du code et des agents en action.</p>
      <article className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
        <Link href={`/blog/${cartpoleArticle.slug}`} className="block group">
          <Image src={cartpoleArticle.image} alt="La démo CartPole en cours d’entraînement DQN" width={1920} height={600} className="w-full h-auto" />
          <div className="p-6 sm:p-8">
            <time dateTime={cartpoleArticle.date} className="text-sm text-slate-400">3 octobre 2026 · Tutoriel</time>
            <h2 className="text-2xl font-semibold mt-3 mb-3 group-hover:text-indigo-300">{cartpoleArticle.title}</h2>
            <p className="text-slate-300">{cartpoleArticle.description}</p>
            <p className="text-indigo-400 mt-5">Lire le tutoriel →</p>
          </div>
        </Link>
      </article>
    </section>
  )
}
