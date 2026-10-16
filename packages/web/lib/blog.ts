import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import environmentArticles from '../data/blog.json'
import enArticles from '../data/blog.en.json'

export interface BlogArticle {
  environment: string
  slug: string
  title: string
  description: string
  date: string
  image: string
  imageAlt: string
  example: string
}

export const cartpoleArticle: BlogArticle = {
  environment: 'cartpole',
  slug: 'premier-agent-cartpole',
  title: 'Entraîner son premier agent avec Ignition sur CartPole',
  description: 'Lancez votre premier entraînement DQN dans le navigateur et observez ses décisions sur CartPole. Code exécutable et captures réelles à l’appui.',
  date: '2026-10-03',
  image: '/images/blog/cartpole/training.png',
  imageAlt: 'La démo CartPole en cours d’entraînement DQN',
  example: 'demo-cartpole/src/examples/first-agent.ts',
}

export const blogArticles: readonly BlogArticle[] = [...environmentArticles, cartpoleArticle]

export function findBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find(article => article.slug === slug)
}

// ─── Localisation ────────────────────────────────────────────────────────────

const enBySlug = new Map(enArticles.map(article => [article.slug, article]))

/** Résout titre/description/imageAlt selon la locale (FR = canonique). */
export function localizeArticle(article: BlogArticle, locale: string): BlogArticle {
  const en = locale === 'en' ? enBySlug.get(article.slug) : undefined
  return en
    ? { ...article, title: en.title, description: en.description, imageAlt: en.imageAlt }
    : article
}

export function getBlogArticles(locale: string): BlogArticle[] {
  return blogArticles.map(article => localizeArticle(article, locale))
}

export function readBlogArticle(article: BlogArticle, locale: string): string {
  const mdxPath = (lng: string) => path.join(process.cwd(), 'blog', `${article.slug}.${lng}.mdx`)
  // ponytail: fallback FR si la traduction EN n'existe pas (article ajouté en FR d'abord)
  const file = locale === 'en' && existsSync(mdxPath('en')) ? mdxPath('en') : mdxPath('fr')
  const source = readFileSync(file, 'utf8')
  const example = readFileSync(path.join(process.cwd(), '..', article.example), 'utf8')
  return source.replace('<!-- FIRST_AGENT_CODE -->', `\`\`\`ts\n${example}\`\`\``)
}

export function readCartpoleArticle(locale = 'fr'): string {
  return readBlogArticle(cartpoleArticle, locale)
}
