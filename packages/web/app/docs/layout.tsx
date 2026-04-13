import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Docs',
    template: '%s — IgnitionAI Docs',
  },
  description: 'Documentation for IgnitionAI — the ML-Agents of the JavaScript creative ecosystem.',
}

const navbar = (
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

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap('/docs')
  return (
    <Layout
      navbar={navbar}
      footer={footer}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/IgnitionAI/ignition/tree/main/packages/web/content"
    >
      {children}
    </Layout>
  )
}
