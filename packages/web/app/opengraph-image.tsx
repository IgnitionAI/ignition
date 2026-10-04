import { renderSocialCard, socialCardSize } from '@/lib/social-card'

export const alt = 'IgnitionAI — Train reinforcement learning agents in your browser'
export const size = socialCardSize
export const contentType = 'image/png'

export default function Image() {
  return renderSocialCard('Train RL agents in your browser', 'Build with JavaScript. Deploy via ONNX.')
}
