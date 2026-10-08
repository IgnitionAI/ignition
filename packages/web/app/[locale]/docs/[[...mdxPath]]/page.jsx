import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../../mdx-components'

const _generateStaticParams = generateStaticParamsFor('mdxPath', 'locale')
// nextra omet la clé locale pour la locale par défaut — nos routes exigent [locale].
export async function generateStaticParams() {
  const params = await _generateStaticParams()
  return params.map(p => ({ locale: 'en', ...p }))
}
// Le switcher de langue (usePathname) renvoie le gabarit '/[locale]/...' pendant
// le prerender — rendre ces pages dynamiques évite les href dynamiques interdits.
export const dynamic = 'force-dynamic'

export async function generateMetadata(props) {
  const params = await props.params
  const { metadata } = await importPage(params?.mdxPath, params?.locale)
  return metadata
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params?.mdxPath, params?.locale)
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
