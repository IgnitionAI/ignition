import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { blogArticles } from '@/lib/blog'
import { getDictionary } from '@/lib/i18n'
import { isLocale, type Locale } from '@/lib/locales'

type BlogParams = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: BlogParams): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'en'
  const t = getDictionary(locale)
  return { title: t.blog.metadata.title, description: t.blog.metadata.description }
}

export default async function BlogPage({ params }: BlogParams) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'en'
  const t = getDictionary(locale)

  return (
    <section lang={locale} className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24">
      <p className="text-indigo-400 mb-3">{t.blog.kicker}</p>
      <h1 className="h1 mb-4">{t.blog.heading}</h1>
      <p className="text-lg text-slate-400 mb-12">{t.blog.subheading}</p>
      <div className="grid gap-8 md:grid-cols-2">
        {blogArticles.map(article => (
          <article key={article.slug} className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
            <Link href={`/${locale}/blog/${article.slug}`} className="block group">
              <Image src={article.image} alt={article.imageAlt} width={1920} height={1080} className="w-full h-auto" />
              <div className="p-6 sm:p-8">
                <time dateTime={article.date} className="text-sm text-slate-400">
                  {new Date(`${article.date}T12:00:00Z`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })} · {t.blog.tutorialLabel}
                </time>
                <h2 className="text-2xl font-semibold mt-3 mb-3 group-hover:text-indigo-300">{article.title}</h2>
                <p className="text-slate-300">{article.description}</p>
                <p className="text-indigo-400 mt-5">{t.blog.readMore}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
