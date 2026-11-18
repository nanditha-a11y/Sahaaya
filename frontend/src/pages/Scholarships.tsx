import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Card from '../components/Card'
import StatusBanner from '../components/StatusBanner'
import {
  applyForScholarship,
  getChildren,
  getScholarships,
  reviewScholarshipApplication,
} from '../api/client'
import { useRole } from '../contexts/RoleContext'

export default function Scholarships() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const isStaffReviewer =
    dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF' || dbRole === 'EDUCATOR'
  const canApply = dbRole === 'STUDENT' || isStaffReviewer

  const [search, setSearch] = useState('')
  const [selectedScholarshipId, setSelectedScholarshipId] = useState('')
  const [selectedChildId, setSelectedChildId] = useState('')
  const [statement, setStatement] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const scholarshipsQuery = useQuery({
    queryKey: ['scholarships'],
    queryFn: () => getScholarships(),
  })

  const childrenQuery = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => getChildren(),
    enabled: isStaffReviewer,
  })

  const applyMutation = useMutation({
    mutationFn: ({
      scholarshipId,
      payload,
    }: {
      scholarshipId: string
      payload: { childId?: string; statement: string }
    }) => applyForScholarship(scholarshipId, payload),
    onSuccess: () => {
      setStatement('')
      setFormError(null)
      setFeedback('Scholarship application submitted.')
      void queryClient.invalidateQueries({ queryKey: ['scholarships'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to submit application.')
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string
      status: 'APPROVED' | 'REJECTED'
    }) => reviewScholarshipApplication(applicationId, status),
    onSuccess: (_data, vars) => {
      setFormError(null)
      setFeedback(`Application marked ${vars.status}.`)
      void queryClient.invalidateQueries({ queryKey: ['scholarships'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to update application status.')
    },
  })

  const items = useMemo(() => {
    const raw = scholarshipsQuery.data ?? []
    const q = search.trim().toLowerCase()
    return q
      ? raw.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.provider.toLowerCase().includes(q) ||
            s.eligibility.toLowerCase().includes(q)
        )
      : raw
  }, [scholarshipsQuery.data, search])

  const children = childrenQuery.data ?? []

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetScholarshipId = selectedScholarshipId || items[0]?.id
    if (!targetScholarshipId || statement.trim().length < 5) {
      setFormError('Select a scholarship and enter a short statement of purpose.')
      return
    }

    applyMutation.mutate({
      scholarshipId: targetScholarshipId,
      payload: {
        childId: isStaffReviewer ? selectedChildId || children[0]?.id : undefined,
        statement: statement.trim(),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Scholarships & Career Hub
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Available grants, vocational sponsorships and college transition guidance.
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search grants or provider…"
          className="p-2 rounded border text-sm"
          style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
        />
      </div>

      <StatusBanner
        loading={scholarshipsQuery.isLoading}
        loadingText="Loading scholarships & applications…"
        error={
          formError ??
          (scholarshipsQuery.isError
            ? scholarshipsQuery.error instanceof Error
              ? scholarshipsQuery.error.message
              : 'Failed to load scholarships.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canApply && items.length > 0 && (
        <form onSubmit={handleApply} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
          <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            {dbRole === 'STUDENT' ? 'Apply for a Scholarship' : 'Nominate a Student for a Grant'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={selectedScholarshipId || items[0]?.id || ''}
              onChange={(e) => setSelectedScholarshipId(e.target.value)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            >
              {items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (₹{s.amount.toLocaleString()})
                </option>
              ))}
            </select>

            {isStaffReviewer && (
              <select
                value={selectedChildId || children[0]?.id || ''}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="p-2 rounded border text-sm"
                style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.education})
                  </option>
                ))}
              </select>
            )}

            <input
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Academic goals & statement of purpose"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
          </div>
          <button
            type="submit"
            disabled={applyMutation.isPending}
            className="btn-primary handwritten text-sm disabled:opacity-60"
          >
            {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((s) => (
          <Card key={s.id} className="polaroid">
            <div className="flex justify-between items-start gap-2">
              <div className="handwritten font-semibold" style={{ color: '#5c4132' }}>
                {s.name}
              </div>
              <span className="vintage-badge text-xs font-semibold">
                ₹{s.amount.toLocaleString()}
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: '#8a6b54' }}>
              {s.provider} • Deadline: {s.deadline}
            </div>
            <div className="text-sm mt-1" style={{ color: '#7a5a44' }}>
              Awarded to {s.awarded} students ({s.totalApplications} total applications)
            </div>

            {s.applications.length > 0 && (
              <div className="mt-3 pt-2 border-t space-y-1.5" style={{ borderColor: '#e6d7c3' }}>
                {s.applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: '#4b3628' }}>
                      {app.child.name} — <strong>{app.status}</strong>
                    </span>
                    {isStaffReviewer &&
                      (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              reviewMutation.mutate({ applicationId: app.id, status: 'APPROVED' })
                            }
                            className="px-2 py-0.5 rounded bg-emerald-800 text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reviewMutation.mutate({ applicationId: app.id, status: 'REJECTED' })
                            }
                            className="px-2 py-0.5 rounded bg-red-800 text-white"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}