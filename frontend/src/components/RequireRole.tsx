import React from 'react'
import { Navigate } from 'react-router-dom'
import { DbUserRole, PortalRole, useRole } from '../contexts/RoleContext'

interface RequireRoleProps {
  children: JSX.Element
  allowed: PortalRole[]
  allowedDbRoles?: DbUserRole[]
}

export default function RequireRole({ children, allowed, allowedDbRoles }: RequireRoleProps) {
  const { role, dbRole, loading } = useRole()

  if (loading) {
    return (
      <div className="glass-card paper-edge mx-auto my-12 max-w-md rounded-2xl p-6 text-center handwritten" style={{ color: '#6b4c3b' }}>
        Checking portal credentials…
      </div>
    )
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to={`/login/${allowed[0]}`} replace />
  }

  if (allowedDbRoles && (!dbRole || !allowedDbRoles.includes(dbRole))) {
    return <Navigate to={`/${role}`} replace />
  }

  return children
}