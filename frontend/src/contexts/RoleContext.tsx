import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { apiRequest } from '../api/client'

export type PortalRole = 'admin' | 'student' | 'donor'
export type DbUserRole =
  | 'SUPER_ADMIN'
  | 'STAFF'
  | 'EDUCATOR'
  | 'HEALTHCARE_STAFF'
  | 'DONOR'
  | 'STUDENT'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: DbUserRole
  organization?: { id: string; name: string; city: string }
}

interface RoleContextValue {
  role: PortalRole | null
  dbRole: DbUserRole | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<UserProfile | null>
  logout: () => Promise<void>
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function mapDbRoleToPortal(dbRole: DbUserRole): PortalRole {
  if (dbRole === 'STUDENT') return 'student'
  if (dbRole === 'DONOR') return 'donor'
  return 'admin'
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (): Promise<UserProfile | null> => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setProfile(null)
        return null
      }
      const res = await apiRequest<{ user: UserProfile }>('/auth/me')
      setProfile(res.user)
      return res.user
    } catch {
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session) {
          setProfile(null)
          setLoading(false)
        } else {
          void refreshProfile()
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const dbRole = profile?.role ?? null
  const role = dbRole ? mapDbRoleToPortal(dbRole) : null

  return (
    <RoleContext.Provider value={{ role, dbRole, profile, loading, refreshProfile, logout }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}