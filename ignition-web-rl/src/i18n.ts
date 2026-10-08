import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const stored = localStorage.getItem('lang')
const initialLng = stored === 'fr' || stored === 'en'
  ? stored
  : navigator.language.startsWith('fr') ? 'fr' : 'en'

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
