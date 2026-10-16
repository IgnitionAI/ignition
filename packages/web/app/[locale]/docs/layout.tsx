import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

import { isLocale, type Locale } from '@/lib/locales'
import LanguageSwitcher from '@/components/ui/language-switcher'

export const metadata = {
  title: {
    default: 'Docs',
    template: '%s — IgnitionAI Docs',
  },
  description: 'Documentation for IgnitionAI — the ML-Agents of the JavaScript creative ecosystem.',
}

export function generateStaticParams(): { locale: string }[] {
  return [{ locale: 'en' }, { locale: 'fr' }]
}

const navbar = (locale: Locale) => (
  <Navbar
    logo={
      <span className="flex items-center gap-2 font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ignition-flame.gif"
          alt=""
          width={32}
          height={32}
          style={{ display: 'inline-block' }}
        />
        <span>IgnitionAI</span>
      </span>
    }
    projectLink="https://github.com/IgnitionAI/ignition"
  />
)

const footer = (
  <Footer>
    MIT {new Date().getFullYear()} — A project by{' '}
    <a
      href="https://www.ignitionai.fr"
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      IgnitionAI
    </a>
  </Footer>
)

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const resolvedParams = await params
  // Sondes de collecte de page data : params peut être partiel — défaut 'en'.
  const raw = resolvedParams?.locale
  const locale: Locale = isLocale(raw) ? raw : 'en'
  // Asymétrie nextra : le pageMap de la locale par défaut enveloppe le contenu
  // dans un nœud « docs » (contentDirBasePath), les autres locales sont à plat.
  // Le nœud « [locale] » (routes marketing) ne doit jamais atteindre la sidebar.
  const rawPageMap = locale === 'en'
    ? await getPageMap('/en/docs')
    : await getPageMap(`/${locale}`)
  // Le scan de routes app de nextra injecte un nœud « [locale] » (routes marketing)
  // à la racine des pageMaps localisés — le retirer avant de nourrir la sidebar.
  const pageMap = rawPageMap.filter(
    item => !('name' in item && item.name === '[locale]')
  )
  return (
    <Layout
      navbar={navbar(locale)}
      footer={footer}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/IgnitionAI/ignition/tree/main/packages/web/content"
    >
      {children}
    </Layout>
  )
}
