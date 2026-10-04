import Image from 'next/image'
import Link from 'next/link'
import { blogArticles } from '@/lib/blog'

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
      <div className="grid gap-8 md:grid-cols-2">
        {blogArticles.map(article => (
          <article key={article.slug} className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
            <Link href={`/blog/${article.slug}`} className="block group">
              <Image src={article.image} alt={article.imageAlt} width={1920} height={1080} className="w-full h-auto" />
              <div className="p-6 sm:p-8">
                <time dateTime={article.date} className="text-sm text-slate-400">
                  {new Date(`${article.date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })} · Tutoriel
                </time>
                <h2 className="text-2xl font-semibold mt-3 mb-3 group-hover:text-indigo-300">{article.title}</h2>
                <p className="text-slate-300">{article.description}</p>
                <p className="text-indigo-400 mt-5">Lire le tutoriel →</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
