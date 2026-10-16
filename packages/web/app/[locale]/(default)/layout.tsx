import { getDictionary } from '@/lib/i18n'
import { isLocale, type Locale } from '@/lib/locales'
import AosInit from '@/components/ui/aos-init'
import Header from '@/components/ui/header'
import Footer from '@/components/ui/footer'

export function generateStaticParams(): { locale: string }[] {
  return [{ locale: 'en' }, { locale: 'fr' }]
}

export default async function DefaultLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : 'en'
  const t = getDictionary(locale)

  return (
    <>
      <AosInit />
      <Header t={t.nav} locale={locale} />

      <main className="grow">
        {children}
      </main>

      <Footer t={t.footer} locale={locale} />
    </>
  )
}
