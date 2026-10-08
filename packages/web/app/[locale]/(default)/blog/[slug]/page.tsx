import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote-client/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import { blogArticles, findBlogArticle, localizeArticle, readBlogArticle } from '@/lib/blog'
import { getDictionary } from '@/lib/i18n'
import { isLocale, type Locale } from '@/lib/locales'

type ArticleParams = { params: Promise<{ slug: string; locale: string }> }

export function generateStaticParams() {
  return blogArticles.filter(article => article.environment !== 'cartpole').map(({ slug }) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: ArticleParams) {
  const { slug, locale } = await params
  const article = findBlogArticle(slug)
  if (!article) notFound()
  const localized = localizeArticle(article, locale)
  return {
    title: localized.title,
    description: localized.description,
    openGraph: { type: 'article', title: localized.title, description: localized.description, publishedTime: localized.date, images: [localized.image] },
  }
}

export default async function EnvironmentArticlePage({ params }: ArticleParams) {
  const { slug, locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'en'
  const t = getDictionary(locale)
  const found = findBlogArticle(slug)
  if (!found) notFound()
  const article = localizeArticle(found, locale)
  const date = new Date(`${article.date}T12:00:00Z`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
  return (
    <article lang={locale} className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24">
      <header className="mb-12">
        <Link href={`/${locale}/blog`} className="text-indigo-400 hover:text-indigo-300">{t.blog.backToBlog}</Link>
        <p className="text-sm text-slate-400 mt-8 mb-3"><time dateTime={article.date}>{date}</time> · {t.blog.tutorialLabel}</p>
        <h1 className="h1 mb-6">{article.title}</h1>
        <p className="text-xl text-slate-300">{article.description}</p>
      </header>
      <div className="prose prose-invert prose-lg max-w-none prose-headings:text-slate-100 prose-a:text-indigo-300 prose-pre:overflow-x-auto prose-pre:bg-slate-950 prose-img:rounded-xl prose-img:border prose-img:border-slate-700">
        <MDXRemote source={readBlogArticle(article, locale)} options={{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: 'one-dark-pro' }]] } }} />
      </div>
    </article>
  )
}
