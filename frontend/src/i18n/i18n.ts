import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import kn from './locales/kn.json'
import te from './locales/te.json'
import ta from './locales/ta.json'
import kok from './locales/kok.json'

const resources = { en: {translation: en}, hi: {translation: hi}, kn: {translation: kn}, te: {translation: te}, ta: {translation: ta}, kok: {translation: kok} }

const saved = localStorage.getItem('sahaaya:lang') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: saved,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  })

export default i18n
