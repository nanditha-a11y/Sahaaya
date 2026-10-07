import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'

export default function RequireRole({children, allowed}:{children:JSX.Element, allowed: Array<'admin'|'student'|'donor'>}){
  const { role } = useRole()
  if(!allowed.includes(role)){
    return <Navigate to="/" replace />
  }
  return children
}
