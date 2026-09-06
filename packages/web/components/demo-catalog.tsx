import demos from '../data/demos.json'

export default function DemoCatalog() {
  return <>
    <p>{demos.length} browser demos share this catalogue with the homepage and static build.</p>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}><thead><tr><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>Demo</th><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>Methods</th><th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #64748b' }}>Run locally</th></tr></thead><tbody>
      {demos.map(demo=><tr key={demo.slug}><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}><a style={{ color: '#60a5fa', fontWeight: 600 }} href={`/demos/${demo.slug}/`}>{demo.title}</a><p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{demo.description}</p></td><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}>{demo.algos}</td><td style={{ verticalAlign: 'top', padding: '16px', borderBottom: '1px solid #64748b66' }}><code style={{ fontSize: 13, overflowWrap: 'anywhere' }}>pnpm --filter {demo.pkg} dev</code></td></tr>)}
    </tbody></table>
  </>
}
