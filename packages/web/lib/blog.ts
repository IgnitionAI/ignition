import { readFileSync } from 'node:fs'
import path from 'node:path'
import environmentArticles from '../data/blog.json'

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

export function readBlogArticle(article: BlogArticle): string {
  const source = readFileSync(path.join(process.cwd(), 'blog', `${article.slug}.mdx`), 'utf8')
  const example = readFileSync(path.join(process.cwd(), '..', article.example), 'utf8')
  return source.replace('<!-- FIRST_AGENT_CODE -->', `\`\`\`ts\n${example}\`\`\``)
}

export function readCartpoleArticle(): string {
  return readBlogArticle(cartpoleArticle)
}
