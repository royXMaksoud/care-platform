import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslation from '../locales/en/translation.json'
import arTranslation from '../locales/ar/translation.json'
import frTranslation from '../locales/fr/translation.json'
import deTranslation from '../locales/de/translation.json'
import kuTranslation from '../locales/ku/translation.json'

const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  },
  fr: {
    translation: frTranslation
  },
  de: {
    translation: deTranslation
  },
  ku: {
    translation: kuTranslation
  }
}

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    supportedLngs: ['en', 'ar', 'fr', 'de', 'ku'], // Supported languages
    
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
      caches: ['localStorage'], // Cache the language in localStorage
      lookupLocalStorage: 'i18nextLng', // Key to store language in localStorage
    },

    interpolation: {
      escapeValue: false // React already protects from XSS
    },

    react: {
      useSuspense: false // Disable suspense for simplicity
    }
  })

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
})

export default i18n

