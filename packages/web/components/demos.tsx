import DEMOS from '../data/demos.json'
import { blogArticles } from '@/lib/blog'
import type { demos as DemosMessages } from '@/messages/en/demos'

export default function Demos({ t }: { t: typeof DemosMessages }) {
  return (
    <section id="demos" className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 border-t border-slate-800">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
              {t.eyebrow}
            </div>
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
              {t.title}
            </h2>
            <p className="text-lg text-slate-400">
              {t.description.replace('{count}', String(DEMOS.length))}
            </p>

          </div>

          {/* Demo grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMOS.map((demo) => (
              <article
                key={demo.title}
                data-aos="fade-up"
                className={`relative group block p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-colors ${
                  demo.featured ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: demo.accent, boxShadow: `0 0 12px ${demo.accent}` }}
                    />
                    <span className="text-xs text-slate-500 font-mono">{demo.tech}</span>
                  </div>
                  {demo.featured && (
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full px-2 py-0.5 font-medium">
                      {t.heroDemo}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2"><a href={`/demos/${demo.slug}/`}>{demo.title}</a></h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{demo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">{demo.algos}</span>
                  <a href={`/demos/${demo.slug}/`} className="text-indigo-400 text-sm font-medium">{t.view}</a>
                </div>
                <a href={`/blog/${blogArticles.find(article => article.environment === demo.slug)?.slug ?? ''}`} className="inline-block mt-4 text-sm text-indigo-300 hover:text-white">{t.readTutorial}</a>
              </article>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
