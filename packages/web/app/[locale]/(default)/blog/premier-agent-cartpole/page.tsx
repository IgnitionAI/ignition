import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote-client/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import { cartpoleArticle, localizeArticle, readCartpoleArticle } from '@/lib/blog'
import { getDictionary } from '@/lib/i18n'
import { isLocale, type Locale } from '@/lib/locales'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const article = localizeArticle(cartpoleArticle, locale)
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      images: [{ url: article.image, width: 1920, height: 600 }],
    },
  }
}

export default async function CartpoleArticlePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'en'
  const t = getDictionary(locale)
  const article = localizeArticle(cartpoleArticle, locale)
  const date = new Date(`${cartpoleArticle.date}T12:00:00Z`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
  return (
    <article lang={locale} className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24">
      <header className="mb-12">
        <Link href={`/${locale}/blog`} className="text-indigo-400 hover:text-indigo-300">{t.blog.backToBlog}</Link>
        <p className="text-sm text-slate-400 mt-8 mb-3"><time dateTime={cartpoleArticle.date}>{date}</time> · {t.blog.tutorialLabel}</p>
        <h1 className="h1 mb-6">{article.title}</h1>
        <p className="text-xl text-slate-300">{t.blog.cartpoleIntro}</p>
      </header>
      <div className="prose prose-invert prose-lg max-w-none prose-headings:text-slate-100 prose-a:text-indigo-300 prose-pre:overflow-x-auto prose-pre:bg-slate-950 prose-img:rounded-xl prose-img:border prose-img:border-slate-700">
        <MDXRemote source={readCartpoleArticle(locale)} options={{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: 'one-dark-pro' }]] } }} />
      </div>
    </article>
  )
}
