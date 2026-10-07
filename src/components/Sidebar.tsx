import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useRole } from '../contexts/RoleContext'

export default function Sidebar({ open }:{open?:boolean}){
  const { t } = useTranslation() as any
  const { role } = useRole()

  const adminNav = [
    {to:'/admin', label: 'Dashboard'},
    {to:'/children', label: 'Children'},
    {to:'/education', label: 'Education'},
    {to:'/health', label: 'Health'},
    {to:'/resources', label: 'Resources'},
    {to:'/donors', label: 'Donors'},
    {to:'/scholarships', label: 'Scholarships'},
    {to:'/mentorship', label: 'Mentorship'},
    {to:'/impact', label: 'Impact'},
    {to:'/vault', label: 'Vault'},
    {to:'/impact-showcase', label: 'ImpactShowcase'}
  ]

  const studentNav = [
    {to:'/student', label: 'Home'},
    {to:'/children', label: 'Children'},
    {to:'/education', label: 'Education'},
    {to:'/resources', label: 'Resources'},
    {to:'/scholarships', label: 'Scholarships'},
    {to:'/mentorship', label: 'Mentorship'},
    {to:'/health', label: 'Health'},
    {to:'/museum', label: 'ImpactShowcase'},
    {to:'/wall', label: 'Vault'}
  ]

  const donorNav = [
    {to:'/donor', label: 'Dashboard'},
    {to:'/donors', label: 'Donations'},
    {to:'/children', label: 'Children'},
    {to:'/impact-showcase', label: 'ImpactShowcase'},
    {to:'/resources', label: 'Resources'},
    {to:'/museum', label: 'Vault'}
  ]

  const navSet = role === 'admin' ? adminNav : role === 'student' ? studentNav : donorNav

  return (
    <aside className={`w-72 p-4 space-y-4 hidden md:block`}> 
      <div className="glass-card p-4 rounded-xl-2">
        <div className="text-sm" style={{color:'#6b4c3b'}}>{t('Home')}</div>
        <nav className="mt-3 flex flex-col gap-2 handwritten" style={{color:'#4b3628'}}>
          {navSet.map(n=> (
            <NavLink key={n.to} to={n.to} className="p-2 rounded-lg hover:bg-white/5">{t(n.label)}</NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
