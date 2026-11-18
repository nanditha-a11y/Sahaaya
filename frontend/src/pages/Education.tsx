import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import {
  createEducationRecord,
  getChildren,
  getEducationOverview,
  logAttendance,
} from '../api/client'
import StatusBanner from '../components/StatusBanner'
import { useRole } from '../contexts/RoleContext'

export default function Education() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const canEdit =
    dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF' || dbRole === 'EDUCATOR'

  const [selectedChildId, setSelectedChildId] = useState('')
  const [grade, setGrade] = useState('Grade 6')
  const [subject, setSubject] = useState('Mathematics')
  const [score, setScore] = useState('86')
  const [term, setTerm] = useState('Term 1')
  const [attendanceStatus, setAttendanceStatus] = useState<
    'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  >('PRESENT')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const childrenQuery = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => getChildren(),
  })

  const overviewQuery = useQuery({
    queryKey: ['education-overview', selectedChildId || 'ALL'],
    queryFn: () => getEducationOverview(selectedChildId || undefined),
  })

  const scoreMutation = useMutation({
    mutationFn: createEducationRecord,
    onSuccess: () => {
      setFormError(null)
      setFeedback('Academic score saved to PostgreSQL.')
      void queryClient.invalidateQueries({ queryKey: ['education-overview'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to save academic record.')
    },
  })

  const attendanceMutation = useMutation({
    mutationFn: logAttendance,
    onSuccess: () => {
      setFormError(null)
      setFeedback(`Attendance marked (${attendanceStatus}).`)
      void queryClient.invalidateQueries({ queryKey: ['education-overview'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to log attendance.')
    },
  })

  const children = childrenQuery.data ?? []
  const overview = overviewQuery.data ?? null

  function handleAddScore(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetChildId = selectedChildId || children[0]?.id
    if (!targetChildId) {
      setFormError('Select a student first.')
      return
    }

    scoreMutation.mutate({
      childId: targetChildId,
      grade,
      subject,
      score: Number(score),
      term,
    })
  }

  function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetChildId = selectedChildId || children[0]?.id
    if (!targetChildId) {
      setFormError('Select a student first.')
      return
    }

    attendanceMutation.mutate({
      childId: targetChildId,
      status: attendanceStatus,
    })
  }

  const chartData = overview?.monthlyTrend ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Education & Progression
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Academic tracking, attendance rates, and learning outcomes across students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs handwritten" style={{ color: '#5c4132' }}>
            Student Filter:
          </label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#4b3628' }}
          >
            <option value="">All Students ({children.length})</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.education})
              </option>
            ))}
          </select>
        </div>
      </div>

      <StatusBanner
        loading={overviewQuery.isLoading || childrenQuery.isLoading}
        loadingText="Loading academic & attendance records…"
        error={
          formError ??
          (overviewQuery.isError
            ? overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : 'Failed to load education overview.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canEdit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={handleAddScore} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
            <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
              Log Academic Assessment
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Grade"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Score %"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Term"
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              />
            </div>
            <button
              type="submit"
              disabled={scoreMutation.isPending}
              className="btn-primary handwritten text-sm disabled:opacity-60"
            >
              {scoreMutation.isPending ? 'Saving…' : 'Save Score'}
            </button>
          </form>

          <form
            onSubmit={handleMarkAttendance}
            className="glass-card p-4 rounded-xl space-y-3 paper-edge"
          >
            <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
              Record Daily Attendance
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as any)}
                className="p-2 rounded border text-sm flex-1"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#4b3628' }}
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
                <option value="ABSENT">Absent</option>
              </select>
              <button
                type="submit"
                disabled={attendanceMutation.isPending}
                className="btn-primary handwritten text-sm disabled:opacity-60"
              >
                {attendanceMutation.isPending ? 'Logging…' : 'Log Attendance'}
              </button>
            </div>
            {overview && (
              <div className="text-xs" style={{ color: '#6b4c3b' }}>
                Attendance Rate: <strong>{overview.attendanceSummary.ratePercent}%</strong> (
                {overview.attendanceSummary.present} present / {overview.attendanceSummary.total}{' '}
                days)
              </div>
            )}
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <h4 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Attendance & Scores
          </h4>
          <div style={{ width: '100%', height: 220 }} className="mt-3">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#9b7b63" />
                <YAxis stroke="#9b7b63" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8a5a36" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <h4 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Recent Academic Evaluations
          </h4>
          <div className="mt-3 space-y-2 text-sm max-h-56 overflow-y-auto" style={{ color: '#5c4132' }}>
            {(overview?.records ?? []).slice(0, 8).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between border-b pb-1"
                style={{ borderColor: '#e6d7c3' }}
              >
                <div>
                  <span className="font-semibold">{rec.child?.name ?? 'Student'}</span> —{' '}
                  {rec.subject} ({rec.grade})
                </div>
                <span className="vintage-badge text-xs font-semibold">{rec.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}