import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote-client/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import { cartpoleArticle, readCartpoleArticle } from '@/lib/blog'

export const metadata = {
  title: cartpoleArticle.title,
  description: cartpoleArticle.description,
  openGraph: {
    type: 'article',
    title: cartpoleArticle.title,
    description: cartpoleArticle.description,
    publishedTime: cartpoleArticle.date,
    images: [{ url: cartpoleArticle.image, width: 1920, height: 600 }],
  },
}

export default function CartpoleArticlePage() {
  return (
    <article lang="fr" className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24">
      <header className="mb-12">
        <Link href="/blog" className="text-indigo-400 hover:text-indigo-300">← Le blog Ignition</Link>
        <p className="text-sm text-slate-400 mt-8 mb-3"><time dateTime={cartpoleArticle.date}>3 octobre 2026</time> · Tutoriel</p>
        <h1 className="h1 mb-6">{cartpoleArticle.title}</h1>
        <p className="text-xl text-slate-300">Un premier agent, une simulation visible et du code que vous pouvez exécuter.</p>
      </header>
      <div className="prose prose-invert prose-lg max-w-none prose-headings:text-slate-100 prose-a:text-indigo-300 prose-pre:overflow-x-auto prose-pre:bg-slate-950 prose-img:rounded-xl prose-img:border prose-img:border-slate-700">
        <MDXRemote source={readCartpoleArticle()} options={{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: 'one-dark-pro' }]] } }} />
      </div>
    </article>
  )
}
