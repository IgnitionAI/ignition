import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs',
})

export default withNextra({
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async rewrites() {
    return [
      // Serve Vite-built demos at /demos/<slug>/ by rewriting to their index.html
      { source: '/demos/:slug', destination: '/demos/:slug/index.html' },
      { source: '/demos/:slug/', destination: '/demos/:slug/index.html' },
    ]
  },
})
