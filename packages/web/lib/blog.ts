import { readFileSync } from 'node:fs'
import path from 'node:path'

export const cartpoleArticle = {
  slug: 'premier-agent-cartpole',
  title: 'Entraîner son premier agent avec Ignition sur CartPole',
  description: 'Un tutoriel concret : lancer CartPole, entraîner un DQN et passer en inférence, avec du code vérifié et trois captures réelles.',
  date: '2026-10-03',
  image: '/images/blog/cartpole/training.png',
}

export function readCartpoleArticle(): string {
  const article = readFileSync(path.join(process.cwd(), 'blog', `${cartpoleArticle.slug}.mdx`), 'utf8')
  const example = readFileSync(path.join(process.cwd(), '../demo-cartpole/src/examples/first-agent.ts'), 'utf8')
  return article.replace('<!-- FIRST_AGENT_CODE -->', `\`\`\`ts\n${example}\`\`\``)
}
