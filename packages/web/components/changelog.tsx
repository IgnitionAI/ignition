import Link from 'next/link'
import { getLatestHighlights } from '@/lib/changelog'

export default function Changelog() {
  const { release, highlights } = getLatestHighlights(5)
  if (!release) return null

  const prettyDate = new Date(release.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 border-t border-slate-800">

          {/* Header */}
          <div className="max-w-3xl mx-auto text-center pb-8 md:pb-12">
            <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
              Recent updates
            </div>
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
              What's new
            </h2>
            <p className="text-lg text-slate-400">
              IgnitionAI ships fast. Here's the latest release — everything else lives on the{' '}
              <Link href="/changelog" className="text-indigo-400 hover:text-indigo-300 underline">
                full changelog
              </Link>
              .
            </p>
          </div>

          {/* Release card */}
          <div
            className="max-w-3xl mx-auto p-6 md:p-8 rounded-xl bg-slate-900/50 border border-slate-800"
            data-aos="fade-up"
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-mono text-sm px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {release.version}
              </span>
              <span className="text-slate-300 font-semibold">{release.title}</span>
              <span className="text-slate-500 text-sm ml-auto">{prettyDate}</span>
            </div>

            <ul className="space-y-3">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                  <div>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2">
                      {h.section}
                    </span>
                    <span className="text-slate-300">{h.bullet}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <Link
                href="/changelog"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                See full changelog →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
