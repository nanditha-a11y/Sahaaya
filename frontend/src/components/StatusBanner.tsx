import React from 'react'

interface StatusBannerProps {
  loading?: boolean
  loadingText?: string
  error?: string | null
  success?: string | null
  onDismissSuccess?: () => void
}

export default function StatusBanner({
  loading,
  loadingText = 'Loading records…',
  error,
  success,
  onDismissSuccess,
}: StatusBannerProps) {
  if (!loading && !error && !success) return null

  return (
    <div className="space-y-2">
      {loading && (
        <div
          role="status"
          className="glass-card rounded-lg px-4 py-2 text-sm handwritten"
          style={{ color: '#6b4c3b' }}
        >
          {loadingText}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-800/20 bg-red-50 px-4 py-2 text-sm text-red-900"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-800/20 bg-emerald-50 px-4 py-2 text-sm text-emerald-900"
        >
          <span>{success}</span>
          {onDismissSuccess && (
            <button
              type="button"
              onClick={onDismissSuccess}
              className="ml-3 text-xs underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  )
}