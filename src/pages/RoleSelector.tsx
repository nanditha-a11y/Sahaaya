import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useRole } from '../contexts/RoleContext'
import VintageIllustration from '../components/VintageIllustration'

export default function RoleSelector(){
  const nav = useNavigate()
  const { t } = useTranslation() as any
  const { setRole } = useRole()

  const choose = (r:'admin'|'student'|'donor')=>{
    setRole(r)
    nav(`/${r}`)
  }

  return (
    <div className="max-w-4xl mx-auto text-center space-y-6 notebook">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="text-3xl handwritten" style={{color:'#6b4c3b'}}>{t('RoleSelectTitle')}</h1>
          <p className="text-sm" style={{color:'#4b3628'}}>{t('SelectRole')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <button onClick={()=>choose('admin')} className="p-6 glass-card handwritten">{t('AdminPortal')}</button>
            <button onClick={()=>choose('student')} className="p-6 glass-card handwritten">{t('StudentPortal')}</button>
            <button onClick={()=>choose('donor')} className="p-6 glass-card handwritten">{t('DonorPortal')}</button>
          </div>
        </div>
        <div className="flex justify-center">
          <VintageIllustration variant="landing" title={t('EmpoweringTitle')} description={t('SelectRole')} />
        </div>
      </div>
    </div>
  )
}
