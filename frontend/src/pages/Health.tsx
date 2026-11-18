import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import WellnessRadar from '../modules/WellnessRadar'
import StatusBanner from '../components/StatusBanner'
import { createHealthRecord, getChildren, getHealthRecords } from '../api/client'
import { useRole } from '../contexts/RoleContext'

export default function Health() {
  const { dbRole } = useRole()
  const queryClient = useQueryClient()
  const canAccessClinical = dbRole === 'SUPER_ADMIN' || dbRole === 'HEALTHCARE_STAFF'

  const [selectedChildId, setSelectedChildId] = useState('')
  const [diagnosisOrNotes, setDiagnosisOrNotes] = useState('')
  const [immunizationNotes, setImmunizationNotes] = useState('Routine immunizations up to date')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [statusSummary, setStatusSummary] = useState<'Good' | 'Fair' | 'Needs Follow-up'>('Good')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const childrenQuery = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => getChildren(),
    enabled: canAccessClinical,
  })

  const recordsQuery = useQuery({
    queryKey: ['health-records', selectedChildId || 'ALL'],
    queryFn: () => getHealthRecords(selectedChildId || undefined),
    enabled: canAccessClinical,
  })

  const createMutation = useMutation({
    mutationFn: createHealthRecord,
    onSuccess: () => {
      setDiagnosisOrNotes('')
      setHeightCm('')
      setWeightKg('')
      setFormError(null)
      setFeedback('Clinical checkup recorded and child health summary updated.')
      void queryClient.invalidateQueries({ queryKey: ['health-records'] })
      void queryClient.invalidateQueries({ queryKey: ['children'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to save clinical record.')
    },
  })

  const children = childrenQuery.data ?? []
  const records = recordsQuery.data ?? []

  function handleRecordCheckup(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const targetChildId = selectedChildId || children[0]?.id
    if (!targetChildId || !diagnosisOrNotes.trim()) {
      setFormError('Please select a child and enter clinical checkup notes.')
      return
    }

    createMutation.mutate({
      childId: targetChildId,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      immunizationNotes: immunizationNotes.trim() || undefined,
      diagnosisOrNotes: diagnosisOrNotes.trim(),
      healthStatusSummary: statusSummary,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Health & Wellness
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Checkups, immunization logs, mental wellness and growth monitoring.
          </p>
        </div>

        {canAccessClinical && (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6', color: '#4b3628' }}
          >
            <option value="">All Children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code ?? 'Child'})
              </option>
            ))}
          </select>
        )}
      </div>

      <StatusBanner
        loading={canAccessClinical && (recordsQuery.isLoading || childrenQuery.isLoading)}
        loadingText="Loading confidential health records…"
        error={
          formError ??
          (recordsQuery.isError
            ? recordsQuery.error instanceof Error
              ? recordsQuery.error.message
              : 'Unable to load health records.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {canAccessClinical && (
        <form
          onSubmit={handleRecordCheckup}
          className="glass-card p-4 rounded-xl space-y-3 paper-edge"
        >
          <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Record Confidential Clinical Checkup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={selectedChildId || children[0]?.id || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
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
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="Height (cm)"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Weight (kg)"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <select
              value={statusSummary}
              onChange={(e) => setStatusSummary(e.target.value as any)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            >
              <option value="Good">Status: Good</option>
              <option value="Fair">Status: Fair</option>
              <option value="Needs Follow-up">Status: Needs Follow-up</option>
            </select>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary handwritten text-sm disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving…' : 'Save Checkup'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={diagnosisOrNotes}
              onChange={(e) => setDiagnosisOrNotes(e.target.value)}
              placeholder="Clinical observations / checkup notes"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <input
              value={immunizationNotes}
              onChange={(e) => setImmunizationNotes(e.target.value)}
              placeholder="Immunization notes"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WellnessRadar />
        <div className="glass-card p-4 rounded-xl">
          <h4 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Medical Records
          </h4>
          {!canAccessClinical ? (
            <p className="mt-3 text-sm" style={{ color: '#6b4c3b' }}>
              Clinical medical records are restricted to Healthcare Staff and Super Admins for child
              privacy.
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-sm max-h-64 overflow-y-auto" style={{ color: '#5c4132' }}>
              {records.map((rec) => (
                <div key={rec.id} className="border-b pb-2" style={{ borderColor: '#e6d7c3' }}>
                  <div className="flex justify-between font-semibold">
                    <span>{rec.child?.name ?? 'Child'}</span>
                    <span className="text-xs" style={{ color: '#8a6b54' }}>
                      {rec.checkupDate.slice(0, 10)}
                    </span>
                  </div>
                  <div>{rec.diagnosisOrNotes}</div>
                  <div className="text-xs" style={{ color: '#7a5a44' }}>
                    {rec.heightCm ? `Height: ${rec.heightCm} cm • ` : ''}
                    {rec.weightKg ? `Weight: ${rec.weightKg} kg • ` : ''}
                    {rec.immunizationNotes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}