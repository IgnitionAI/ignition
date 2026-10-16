export const metadata = {
  title: 'IgnitionAI — Train RL agents in your browser',
  description: 'The ML-Agents of the JavaScript creative ecosystem. Train reinforcement learning agents directly in the browser, deploy anywhere via ONNX.',
}

import Hero from '@/components/hero'
import QuickStart from '@/components/quickstart'
import Features from '@/components/features'
import Features02 from '@/components/features-02'
import Playground from '@/components/playground'
import Demos from '@/components/demos'
import Cta from '@/components/cta'
import Changelog from '@/components/changelog'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/locales'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getDictionary(isLocale(locale) ? locale : 'en')

  // Structure identique à la landing d'origine — les autres sections traduites
  // (clients, story, demoCatalog, pricing, customers, team) restent disponibles
  // dans les dictionnaires pour une future utilisation.
  return (
    <>
      <Hero t={t.hero} />
      <QuickStart t={t.quickstart} />
      <Features t={t.features} />
      <Features02 t={t.features02} />
      <Playground t={t.playground} />
      <Demos t={t.demos} />
      <Changelog t={t.changelog.section} />
      <Cta t={t.cta} />
    </>
  )
}
