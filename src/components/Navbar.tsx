import React from 'react'
import { Menu } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'
import { useRole } from '../contexts/RoleContext'

export default function Navbar({ onMenu }:{onMenu?: ()=>void}){
  const { t, lang, setLang } = useTranslation() as any
  const { role, setRole } = useRole()

  const languages = [
    {code:'en', label: 'English'},
    {code:'kn', label: 'ಕನ್ನಡ Kannada'},
    {code:'hi', label: 'हिन्दी Hindi'},
    {code:'te', label: 'తెలుగు Telugu'},
    {code:'ta', label: 'தமிழ் Tamil'},
    {code:'kok', label: 'कोंकणी Konkani'}
  ]

  return (
    <header className="py-4 px-6 flex items-center justify-between glass-card paper-edge">
      <div className="flex items-center gap-4">
        <button onClick={onMenu} className="p-2 rounded-lg hover:bg-[#00000005] text-vintageBrown"><Menu/></button>
        <div className="text-2xl font-bold handwritten" style={{color:'#6b4c3b'}}>SAHAAYA</div>
        <div className="text-sm handwritten ml-2" style={{color:'#4b3628'}}>Empowering Every Child</div>
      </div>
      <nav className="flex items-center gap-4 handwritten text-sm" style={{color:'#3b2b20'}}>
        <div className="flex items-center gap-3">
          <select value={lang} onChange={e=>setLang(e.target.value)} className="rounded p-1 bg-white/80 text-sm">
            {languages.map(l=> <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{color:'#5a4433'}}>{t('Language')}</label>
        </div>
        <div className="flex items-center gap-2">
          <select value={role||'admin'} onChange={e=>setRole(e.target.value as any)} className="rounded p-1 bg-white/80 text-sm">
            <option value="admin">Admin View</option>
            <option value="student">Student View</option>
            <option value="donor">Donor View</option>
          </select>
        </div>
      </nav>
    </header>
  )
}
