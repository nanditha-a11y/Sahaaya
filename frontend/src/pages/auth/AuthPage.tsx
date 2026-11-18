import React, { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { apiRequest } from '../../api/client'
import { DbUserRole, mapDbRoleToPortal, PortalRole, useRole } from '../../contexts/RoleContext'

const PORTAL_META: Record<PortalRole, { title: string; subtitle: string; defaultDbRole: DbUserRole }> = {
  admin: {
    title: 'Admin & Staff Portal',
    subtitle: 'Manage child care records, education, health, and resources.',
    defaultDbRole: 'STAFF',
  },
  student: {
    title: 'Student Portal',
    subtitle: 'Track your learning journey, scholarships, and mentorship.',
    defaultDbRole: 'STUDENT',
  },
  donor: {
    title: 'Donor Portal',
    subtitle: 'Follow your contributions and the lives you help nurture.',
    defaultDbRole: 'DONOR',
  },
}

export default function AuthPage() {
  const { role: roleParam } = useParams<{ role?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshProfile } = useRole()

  const portalRole: PortalRole =
    roleParam === 'student' || roleParam === 'donor' ? roleParam : 'admin'
  const isRegistration = location.pathname.startsWith('/register')
  const isResetPassword = location.pathname === '/reset-password'
  const meta = PORTAL_META[portalRole]

  const [staffRole, setStaffRole] = useState<DbUserRole>('STAFF')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const alternatePath = isRegistration ? `/login/${portalRole}` : `/register/${portalRole}`

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      setError('Enter your email address above first to receive a password reset link.')
      return
    }
    setError('')
    setNotice('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (resetErr) {
      setError(resetErr.message)
    } else {
      setNotice('Password reset instructions have been sent to your email.')
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    try {
      if (isResetPassword) {
        const confirmPassword = String(formData.get('confirmPassword') ?? '')
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        const { error: updateErr } = await supabase.auth.updateUser({ password })
        if (updateErr) throw updateErr
        const user = await refreshProfile()
        const target = user ? `/${mapDbRoleToPortal(user.role)}` : '/login/admin'
        navigate(target, { replace: true })
        return
      }

      if (isRegistration) {
        const name = String(formData.get('name') ?? '').trim()
        const confirmPassword = String(formData.get('confirmPassword') ?? '')
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }

        const chosenRole: DbUserRole = portalRole === 'admin' ? staffRole : meta.defaultDbRole

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role: chosenRole } },
        })
        if (signUpErr) throw signUpErr

        if (signUpData.session) {
          await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, role: chosenRole }),
          })
          const user = await refreshProfile()
          const target = user ? `/${mapDbRoleToPortal(user.role)}` : `/${portalRole}`
          navigate(target, { replace: true })
        } else {
          setNotice('Account created! Check your email to confirm, then sign in.')
        }
        return
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) throw signInErr

      const user = await refreshProfile()
      const target = user ? `/${mapDbRoleToPortal(user.role)}` : `/${portalRole}`
      navigate(target, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto my-8 max-w-md"
    >
      <div className="glass-card paper-edge rounded-2xl p-8">
        <h1 className="handwritten text-3xl" style={{ color: '#6b4c3b' }}>
          {isResetPassword
            ? 'Reset Password'
            : isRegistration
            ? `Create ${meta.title} Account`
            : meta.title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#5a4433' }}>
          {isResetPassword ? 'Choose a new password for your Sahaaya account.' : meta.subtitle}
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {isRegistration && (
            <label className="block text-sm" style={{ color: '#4b3628' }}>
              Full name
              <input
                name="name"
                type="text"
                autoComplete="name"
                minLength={2}
                required
                className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]"
              />
            </label>
          )}

          {isRegistration && portalRole === 'admin' && (
            <label className="block text-sm" style={{ color: '#4b3628' }}>
              Staff designation
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as DbUserRole)}
                className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]"
              >
                <option value="STAFF">General Staff</option>
                <option value="EDUCATOR">Educator</option>
                <option value="HEALTHCARE_STAFF">Healthcare Staff</option>
              </select>
            </label>
          )}

          {!isResetPassword && (
            <label className="block text-sm" style={{ color: '#4b3628' }}>
              Email address
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]"
              />
            </label>
          )}

          <label className="block text-sm" style={{ color: '#4b3628' }}>
            {isResetPassword ? 'New password' : 'Password'}
            <input
              name="password"
              type="password"
              autoComplete={isRegistration || isResetPassword ? 'new-password' : 'current-password'}
              minLength={8}
              required
              className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]"
            />
          </label>

          {(isRegistration || isResetPassword) && (
            <label className="block text-sm" style={{ color: '#4b3628' }}>
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="mt-1 w-full rounded-lg border border-[#6b4c3b]/20 bg-[#fffdf7] p-3 outline-none focus:border-[#6b4c3b]"
              />
            </label>
          )}

          {!isRegistration && !isResetPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('auth-email') as HTMLInputElement | null
                  void handleForgotPassword(input?.value.trim() ?? '')
                }}
                className="text-xs underline"
                style={{ color: '#6b4c3b' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {notice && (
            <p role="status" className="rounded-lg border border-emerald-800/20 bg-emerald-50 p-3 text-sm text-emerald-900">
              {notice}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-800/20 bg-red-50 p-3 text-sm text-red-900">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary handwritten w-full text-lg">
            {submitting
              ? 'Please wait…'
              : isResetPassword
              ? 'Update password'
              : isRegistration
              ? 'Create account'
              : 'Continue'}
          </button>
        </form>

        {!isResetPassword && (
          <p className="mt-5 text-center text-sm" style={{ color: '#4b3628' }}>
            {isRegistration ? 'Already registered?' : 'New to Sahaaya?'}{' '}
            <Link className="font-semibold underline" style={{ color: '#6b4c3b' }} to={alternatePath}>
              {isRegistration ? 'Login' : 'Create an account'}
            </Link>
          </p>
        )}
      </div>
    </motion.section>
  )
}