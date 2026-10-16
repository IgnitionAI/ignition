import type { Messages } from '@/messages/en'
import type { Locale } from './locales'
import { defaultLocale } from './locales'

// Dictionnaires bundlés (imports statiques) : en = source de vérité typée,
// fr contraint par `satisfies` dans chaque fichier de messages.
import en from '@/messages/en'
import fr from '@/messages/fr'

export function getDictionary(locale: Locale): Messages {
  return (locale === 'fr' ? fr : en) as Messages
}
export { defaultLocale }
