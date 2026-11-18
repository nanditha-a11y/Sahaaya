import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMentorshipSession, getChildren, getMentorshipOverview } from '../api/client'
import StatusBanner from '../components/StatusBanner'
import { useRole } from '../contexts/RoleContext'

export default function Mentorship() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const canSchedule =
    dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF' || dbRole === 'EDUCATOR'

  const [search, setSearch] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [childId, setChildId] = useState('')
  const [topic, setTopic] = useState('')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [durationMin, setDurationMin] = useState('45')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const overviewQuery = useQuery({
    queryKey: ['mentorship-overview'],
    queryFn: () => getMentorshipOverview(),
  })

  const childrenQuery = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => getChildren(),
    enabled: canSchedule,
  })

  const scheduleMutation = useMutation({
    mutationFn: createMentorshipSession,
    onSuccess: () => {
      setTopic('')
      setFormError(null)
      setFeedback('Mentorship session scheduled.')
      void queryClient.invalidateQueries({ queryKey: ['mentorship-overview'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to schedule session.')
    },
  })

  const mentors = useMemo(() => {
    const raw = overviewQuery.data?.mentors ?? []
    const q = search.trim().toLowerCase()
    return q
      ? raw.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.specialty.toLowerCase().includes(q) ||
            (m.city ?? '').toLowerCase().includes(q)
        )
      : raw
  }, [overviewQuery.data?.mentors, search])

  const sessions = overviewQuery.data?.sessions ?? []
  const children = childrenQuery.data ?? []

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetMentorId = mentorId || mentors[0]?.id
    const targetChildId = childId || children[0]?.id
    if (!targetMentorId || !targetChildId || !topic.trim()) {
      setFormError('Select a mentor, student, and session topic.')
      return
    }

    scheduleMutation.mutate({
      mentorId: targetMentorId,
      childId: targetChildId,
      topic: topic.trim(),
      sessionDate,
      durationMin: Number(durationMin) || 45,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Mentorship & Guidance
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Connect students with volunteer mentors across STEM, arts, and career readiness.
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mentor or specialty…"
          className="p-2 rounded border text-sm"
          style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
        />
      </div>

      <StatusBanner
        loading={overviewQuery.isLoading}
        loadingText="Loading volunteer mentors & sessions…"
        error={
          formError ??
          (overviewQuery.isError
            ? overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : 'Failed to load mentorship directory.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canSchedule && mentors.length > 0 && children.length > 0 && (
        <form onSubmit={handleSchedule} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
          <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Schedule Mentorship Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={mentorId || mentors[0]?.id || ''}
              onChange={(e) => setMentorId(e.target.value)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            >
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.specialty})
                </option>
              ))}
            </select>

            <select
              value={childId || children[0]?.id || ''}
              onChange={(e) => setChildId(e.target.value)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Session topic"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />

            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />

            <div className="flex gap-2">
              <input
                type="number"
                min="15"
                max="240"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="p-2 rounded border text-sm w-20"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <button
                type="submit"
                disabled={scheduleMutation.isPending}
                className="btn-primary handwritten text-sm flex-1 disabled:opacity-60"
              >
                {scheduleMutation.isPending ? 'Saving…' : 'Schedule'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mentors.map((m) => (
          <div key={m.id} className="polaroid p-4 rounded-xl">
            <div className="handwritten font-semibold text-lg" style={{ color: '#5c4132' }}>
              {m.name}
            </div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: '#8a5a36' }}>
              {m.specialty} {m.city ? `• ${m.city}` : ''}
            </div>
            {m.bio && (
              <p className="text-xs mt-2" style={{ color: '#6b4c3b' }}>
                {m.bio}
              </p>
            )}
            <div className="text-xs mt-2" style={{ color: '#8a6b54' }}>
              {m._count.sessions} sessions completed
            </div>
          </div>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="glass-card p-4 rounded-xl space-y-2">
          <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Recent & Upcoming Sessions
          </h3>
          {sessions.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap justify-between text-sm border-b pb-1.5"
              style={{ borderColor: '#e6d7c3', color: '#4b3628' }}
            >
              <span>
                <strong>{s.topic}</strong> — {s.child.name} with {s.mentor.name}
              </span>
              <span className="text-xs" style={{ color: '#7a5a44' }}>
                {s.sessionDate.slice(0, 10)} ({s.durationMin} mins)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}