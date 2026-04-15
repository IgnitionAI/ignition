import Link from 'next/link'
import { getChangelog } from '@/lib/changelog'

export const metadata = {
  title: 'Changelog',
  description: 'Release notes and shipped features for IgnitionAI.',
}

export default function ChangelogPage() {
  const releases = getChangelog()

  return (
    <section className="relative pt-32 md:pt-40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="pb-10 md:pb-14 text-center">
          <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
            Changelog
          </div>
          <h1 className="h1 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
            What we've shipped
          </h1>
          <p className="text-lg text-slate-400">
            Every release, with its full list of changes. Source of truth is{' '}
            <a
              href="https://github.com/IgnitionAI/ignition/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              CHANGELOG.md on GitHub
            </a>
            .
          </p>
        </div>

        {/* Releases */}
        <div className="space-y-12 pb-24">
          {releases.map((release) => {
            const prettyDate = new Date(release.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            return (
              <article
                key={release.version}
                className="p-6 md:p-8 rounded-xl bg-slate-900/40 border border-slate-800"
              >
                <header className="flex items-baseline gap-3 flex-wrap mb-2">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100">
                    {release.version}
                  </h2>
                  <span className="text-slate-400">— {release.title}</span>
                  <span className="text-slate-500 text-sm ml-auto">{prettyDate}</span>
                </header>

                <div className="mt-6 space-y-6">
                  {release.sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-sm font-mono uppercase tracking-wider text-indigo-400 mb-2">
                        {section.title}
                      </h3>
                      <ul className="space-y-2 text-slate-300">
                        {section.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-1 h-1 rounded-full bg-indigo-400 mt-2.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>

        {/* Back to landing */}
        <div className="text-center pb-16">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to IgnitionAI
          </Link>
        </div>

      </div>
    </section>
  )
}
