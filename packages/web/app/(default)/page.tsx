export const metadata = {
  title: 'IgnitionAI — Train RL agents in your browser',
  description: 'The ML-Agents of the JavaScript creative ecosystem. Train reinforcement learning agents directly in the browser, deploy anywhere via ONNX.',
}

import Hero from '@/components/hero'
import QuickStart from '@/components/quickstart'
import Features from '@/components/features'
import Features02 from '@/components/features-02'
import Demos from '@/components/demos'
import Changelog from '@/components/changelog'
import Cta from '@/components/cta'

export default function Home() {
  return (
    <>
      <Hero />
      <QuickStart />
      <Features />
      <Features02 />
      <Demos />
      <Changelog />
      <Cta />
    </>
  )
}
