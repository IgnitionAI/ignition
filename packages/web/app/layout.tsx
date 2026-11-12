import './css/style.css'

import { headers } from 'next/headers'
import localFont from 'next/font/local'

import { isLocale } from '@/lib/locales'

const displayFont = localFont({
  src: '../public/fonts/ignition/Geist-Variable.woff2',
  variable: '--font-geist-display',
  display: 'swap'
})

const bodyFont = localFont({
  src: '../public/fonts/ignition/Geist-Variable.woff2',
  variable: '--font-geist',
  display: 'swap'
})

const monoFont = localFont({
  src: '../public/fonts/ignition/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap'
})

export const metadata = {
  title: {
    default: 'IgnitionAI — Train RL agents in your browser',
    template: '%s — IgnitionAI',
  },
  description:
    'The ML-Agents of the JavaScript creative ecosystem. Train reinforcement learning agents directly in the browser. Deploy anywhere via ONNX.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // La locale voyage en header (injectée par middleware) — le root layout
  // ne reçoit pas de params sous Next 16 (typed routes).
  const locale = (await headers()).get('x-locale') ?? 'en'

  return (
    <html
      lang={isLocale(locale) ? locale : 'en'}
      dir="ltr"
      suppressHydrationWarning
      className={`scroll-smooth ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="font-inter antialiased bg-slate-900 text-slate-100">
        <div className="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </div>
      </body>
    </html>
  )
}
