import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { DbUserRole, useRole } from '../contexts/RoleContext'

interface NavItem {
  to: string
  label: string
  allowedDbRoles?: DbUserRole[]
}

export default function Sidebar({ open }:{open?:boolean}){
  const { t } = useTranslation() as any
  const { role, dbRole } = useRole()
  if (!role) return null

  const adminNav: NavItem[] = [
    {to:'/admin', label: 'Dashboard'},
    {to:'/children', label: 'Children'},
    {to:'/education', label: 'Education', allowedDbRoles: ['SUPER_ADMIN', 'STAFF', 'EDUCATOR']},
    {to:'/health', label: 'Health', allowedDbRoles: ['SUPER_ADMIN', 'STAFF', 'HEALTHCARE_STAFF']},
    {to:'/resources', label: 'Resources', allowedDbRoles: ['SUPER_ADMIN', 'STAFF']},
    {to:'/donors', label: 'Donors', allowedDbRoles: ['SUPER_ADMIN', 'STAFF']},
    {to:'/scholarships', label: 'Scholarships', allowedDbRoles: ['SUPER_ADMIN', 'STAFF', 'EDUCATOR']},
    {to:'/mentorship', label: 'Mentorship', allowedDbRoles: ['SUPER_ADMIN', 'STAFF', 'EDUCATOR']},
    {to:'/impact', label: 'Impact'},
    {to:'/vault', label: 'Vault'},
    {to:'/impact-showcase', label: 'ImpactShowcase'}
  ]

  const studentNav: NavItem[] = [
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

  const donorNav: NavItem[] = [
    {to:'/donor', label: 'Dashboard'},
    {to:'/donors', label: 'Donations'},
    {to:'/children', label: 'Children'},
    {to:'/impact-showcase', label: 'ImpactShowcase'},
    {to:'/resources', label: 'Resources'},
    {to:'/museum', label: 'Vault'}
  ]

  const rawNav = role === 'admin' ? adminNav : role === 'student' ? studentNav : donorNav
  const navSet = rawNav.filter(
    (item) => !item.allowedDbRoles || (dbRole && item.allowedDbRoles.includes(dbRole))
  )

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