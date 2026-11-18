import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMessages, postMessage } from '../api/client'
import StatusBanner from '../components/StatusBanner'
import { useRole } from '../contexts/RoleContext'

export default function MessageWall() {
  const { profile, dbRole } = useRole()
  const queryClient = useQueryClient()
  const [fromName, setFromName] = useState(profile?.name ?? '')
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const messagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
  })

  const postMutation = useMutation({
    mutationFn: (payload: { from: string; role: string; text: string }) => postMessage(payload),
    onSuccess: () => {
      setText('')
      setFormError(null)
      setFeedback('Your encouragement note has been pinned to the Message Wall.')
      void queryClient.invalidateQueries({ queryKey: ['messages'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to post message.')
    },
  })

  function handlePost(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const sender = (fromName.trim() || profile?.name || 'Well-Wisher').trim()
    if (!text.trim()) {
      setFormError('Please write a short message before posting.')
      return
    }

    postMutation.mutate({
      from: sender,
      role: dbRole ?? 'Supporter',
      text: text.trim(),
    })
  }

  const messages = messagesQuery.data ?? []

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge space-y-4">
      <div>
        <h3 className="handwritten text-2xl" style={{ color: '#6b4c3b' }}>
          Encouragement & Gratitude Wall
        </h3>
        <p className="text-sm" style={{ color: '#7a5a44' }}>
          Public notes of support, gratitude, and encouragement for our children.
        </p>
      </div>

      <StatusBanner
        loading={messagesQuery.isLoading}
        loadingText="Loading message wall notes…"
        error={
          formError ??
          (messagesQuery.isError
            ? messagesQuery.error instanceof Error
              ? messagesQuery.error.message
              : 'Failed to load messages.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      <form onSubmit={handlePost} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder={profile?.name ?? 'Your name'}
          className="p-2 rounded border text-sm"
          style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a warm note of encouragement…"
          className="md:col-span-2 p-2 rounded border text-sm"
          style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
        />
        <button
          type="submit"
          disabled={postMutation.isPending}
          className="btn-primary handwritten disabled:opacity-60"
        >
          {postMutation.isPending ? 'Pinning…' : 'Pin Note'}
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {messages.map((m) => (
          <div key={m.id} className="polaroid p-4 rounded-xl">
            <div className="text-sm font-semibold" style={{ color: '#5c4132' }}>
              {m.from}{' '}
              <span className="text-xs" style={{ color: '#8a6b54' }}>
                ({m.role})
              </span>
            </div>
            <div className="mt-2 text-sm" style={{ color: '#6b4c3b' }}>
              “{m.text}”
            </div>
            <div className="mt-2 text-xs text-right" style={{ color: '#8a6b54' }}>
              {m.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}