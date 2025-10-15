// i18n.js — Internationalization setup for the whole app
// Purpose: Initialize i18next with languages, detection, and React bindings.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Resource bundles (you can split these into separate files later)
const en = { common: {
  save: 'Save', cancel: 'Cancel', search: 'Search…', loading: 'Loading…',
  'validation.required': 'This field is required',
  'notify.email.sent': 'Email sent successfully',
  'notify.sms.sent': 'SMS sent successfully',
  'select.noOptions': 'No options',
}}
const ar = { common: {
  save: 'حفظ', cancel: 'إلغاء', search: 'بحث…', loading: 'جارٍ التحميل…',
  'validation.required': 'هذا الحقل مطلوب',
  'notify.email.sent': 'تم إرسال البريد بنجاح',
  'notify.sms.sent': 'تم إرسال الرسالة بنجاح',
  'select.noOptions': 'لا توجد عناصر',
}}
const de = { common: {
  save: 'Speichern', cancel: 'Abbrechen', search: 'Suchen…', loading: 'Wird geladen…',
  'validation.required': 'Pflichtfeld',
  'notify.email.sent': 'E-Mail erfolgreich gesendet',
  'notify.sms.sent': 'SMS erfolgreich gesendet',
  'select.noOptions': 'Keine Optionen',
}}
const fr = { common: {
  save: 'Enregistrer', cancel: 'Annuler', search: 'Rechercher…', loading: 'Chargement…',
  'validation.required': 'Champ requis',
  'notify.email.sent': 'E-mail envoyé avec succès',
  'notify.sms.sent': 'SMS envoyé avec succès',
  'select.noOptions': 'Aucune option',
}}

i18n
  // Detect user language from URL/localStorage/cookies/navigator
  .use(LanguageDetector)
  // Bind i18next to React
  .use(initReactI18next)
  // Initialize configuration
  .init({
    fallbackLng: 'en',                   // Default language
    supportedLngs: ['en', 'ar', 'de', 'fr'],
    resources: { en, ar, de, fr },       // Translation resources
    ns: ['common'],                      // Default namespace
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      // Language detection order and cache
      order: ['querystring', 'localStorage', 'cookie', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
