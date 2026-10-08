import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs',
})

export default withNextra({
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Lu par nextra (NEXTRA_LOCALES pour son pageMap/proxy) — Next App Router
  // l'ignore lui-même ; notre proxy maison gère le routing /[locale].
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  async rewrites() {
    return [
      // Serve Vite-built demos at /demos/<slug>/ by rewriting to their index.html
      { source: '/demos/:slug', destination: '/demos/:slug/index.html' },
      { source: '/demos/:slug/', destination: '/demos/:slug/index.html' },
    ]
  },
})
