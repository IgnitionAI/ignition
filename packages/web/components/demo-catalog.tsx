import demos from '../data/demos.json'
import type { demoCatalog as DemoCatalogMessages } from '@/messages/en/demo-catalog'

export default function DemoCatalog({ t }: { t: typeof DemoCatalogMessages }) {
  return <>
    <p>{t.intro.replace('{count}', String(demos.length))}</p>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}><thead><tr><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>{t.columns.demo}</th><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>{t.columns.methods}</th><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>{t.columns.runLocally}</th></tr></thead><tbody>
      {demos.map(demo=><tr key={demo.slug}><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}><a style={{ color: '#60a5fa', fontWeight: 600 }} href={`/demos/${demo.slug}/`}>{demo.title}</a><p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{demo.description}</p></td><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}>{demo.algos}</td><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}><code style={{ fontSize: 13, overflowWrap: 'anywhere' }}>pnpm --filter {demo.pkg} dev</code></td></tr>)}
    </tbody></table>
  </>
}
