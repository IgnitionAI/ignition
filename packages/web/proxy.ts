import { NextRequest, NextResponse } from 'next/server'

import { defaultLocale, isLocale, locales } from './lib/locales'

const COOKIE = 'locale'

// Routes hors périmètre i18n : démos servies en rewrite, API, fichiers.
// /docs (sans locale) est redirigé plus bas vers la locale négociée.
function isExcluded(pathname: string): boolean {
  return (
    pathname.startsWith('/demos') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.[^/]+$/.test(pathname)
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isExcluded(pathname)) return NextResponse.next()

  // Déjà sur une locale : on persiste le choix et on sert.
  const firstSegment = pathname.split('/')[1]

  // /docs sans préfixe de locale → redirection vers la locale négociée.
  if (pathname === '/docs' || pathname.startsWith('/docs/')) {
    const cookieLocale = request.cookies.get(COOKIE)?.value
    const acceptLanguage = request.headers.get('accept-language') ?? ''
    const locale = isLocale(cookieLocale)
      ? cookieLocale
      : acceptLanguage.toLowerCase().startsWith('fr')
        ? 'fr'
        : defaultLocale
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    const redirect = NextResponse.redirect(url)
    redirect.cookies.set(COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return redirect
  }

  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', firstSegment)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (request.cookies.get(COOKIE)?.value !== firstSegment) {
      response.cookies.set(COOKIE, firstSegment, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
    return response
  }

  // Négociation : cookie persistant d'abord, sinon Accept-Language.
  const cookieLocale = request.cookies.get(COOKIE)?.value
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : acceptLanguage.toLowerCase().startsWith('fr')
      ? 'fr'
      : defaultLocale

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  const redirect = NextResponse.redirect(url)
  redirect.cookies.set(COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return redirect
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
