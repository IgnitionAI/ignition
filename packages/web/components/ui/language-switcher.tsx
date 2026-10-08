'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { locales, type Locale } from '@/lib/locales'

// Bascule FR/EN par liens simples : le middleware persiste la locale en cookie.
// Le layout racine ne re-render pas lors des navigations client : on synchronise
// l'attribut lang de <html> ici (ce composant est monté dans le header partout).
export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const rest = pathname.split('/').slice(2).join('/')

  useEffect(() => {
    const pathLocale = pathname.split('/')[1]
    if (pathLocale === 'fr' || pathLocale === 'en') {
      document.documentElement.lang = pathLocale
    }
  }, [pathname])

  return (
    <div className="flex items-center gap-1 text-sm" aria-label="Language switcher">
      {locales.map((lng) => (
        <Link
          key={lng}
          href={`/${lng}${rest ? `/${rest}` : ''}`}
          className={
            lng === locale
              ? 'px-2 py-1 font-semibold text-white'
              : 'px-2 py-1 text-slate-400 hover:text-white transition duration-150 ease-in-out'
          }
          aria-current={lng === locale ? 'true' : undefined}
        >
          {lng.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
