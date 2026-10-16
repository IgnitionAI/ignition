import { MDXRemote } from 'next-mdx-remote-client/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'

/** Keep the Markdown dialect identical across blog routes. */
export async function BlogContent({ source }: { source: string }) {
  return MDXRemote({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, { theme: 'one-dark-pro' }]],
      },
    },
  })
}
