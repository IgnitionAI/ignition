import { cartpoleArticle } from '@/lib/blog'
import { renderSocialCard, socialCardSize } from '@/lib/social-card'

export const alt = 'Entraîner son premier agent avec Ignition sur CartPole'
export const size = socialCardSize
export const contentType = 'image/png'

export default function Image() {
  return renderSocialCard(cartpoleArticle.title, `Tutoriel CartPole · ${cartpoleArticle.date}`)
}
