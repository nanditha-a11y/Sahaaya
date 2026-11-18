import { useTranslation as useI18next } from 'react-i18next'
import i18n from './i18n'

export const LangProvider: React.FC<{children:React.ReactNode}> = ({children})=>{
  return <>{children}</>
}

export const useTranslation = ()=>{
  const { t, i18n: ix } = useI18next()
  return { t, lang: ix.language, setLang: (l:string)=>{ ix.changeLanguage(l); localStorage.setItem('sahaaya:lang', l) } }
}
