import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Card from '../components/Card'
import StatusBanner from '../components/StatusBanner'
import { createDonation, getDonorsOverview } from '../api/client'
import { useRole } from '../contexts/RoleContext'

export default function Donors() {
  const { dbRole, profile } = useRole()
  const queryClient = useQueryClient()
  const canDonate =
    dbRole === 'DONOR' || dbRole === 'SUPER_ADMIN' || dbRole === 'STAFF'

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'total' | 'name'>('total')
  const [amount, setAmount] = useState('2500')
  const [campaignId, setCampaignId] = useState('')
  const [donorName, setDonorName] = useState(profile?.name ?? '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const overviewQuery = useQuery({
    queryKey: ['donors-overview'],
    queryFn: () => getDonorsOverview(),
  })

  const donationMutation = useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      setFormError(null)
      setFeedback(`Thank you! Contribution of ₹${Number(amount).toLocaleString()} recorded.`)
      void queryClient.invalidateQueries({ queryKey: ['donors-overview'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Unable to record donation.')
    },
  })

  const campaigns = overviewQuery.data?.campaigns ?? []
  const donors = useMemo(() => {
    const raw = overviewQuery.data?.donors ?? []
    const q = search.trim().toLowerCase()
    const filtered = q
      ? raw.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.city ?? '').toLowerCase().includes(q)
        )
      : raw

    return [...filtered].sort((a, b) =>
      sortBy === 'total' ? b.total - a.total : a.name.localeCompare(b.name)
    )
  }, [overviewQuery.data?.donors, search, sortBy])

  function handleDonate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFeedback(null)

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a positive donation amount.')
      return
    }

    donationMutation.mutate({
      amount: numericAmount,
      campaignId: campaignId || undefined,
      donorName: donorName.trim() || undefined,
      isAnonymous,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
            Donor Transparency
          </h2>
          <p className="text-sm" style={{ color: '#7a5a44' }}>
            Transparent reporting of contributions and fund allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor or city…"
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'total' | 'name')}
            className="p-2 rounded border text-sm"
            style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
          >
            <option value="total">Sort: Highest Contribution</option>
            <option value="name">Sort: Donor Name</option>
          </select>
        </div>
      </div>

      <StatusBanner
        loading={overviewQuery.isLoading}
        loadingText="Loading donor ledger & active campaigns…"
        error={
          formError ??
          (overviewQuery.isError
            ? overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : 'Failed to load donor transparency data.'
            : null)
        }
        success={feedback}
        onDismissSuccess={() => setFeedback(null)}
      />

      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="glass-card p-4 rounded-xl space-y-2 paper-edge">
              <div className="flex justify-between items-center">
                <span className="handwritten font-semibold text-lg" style={{ color: '#5c4132' }}>
                  {c.title}
                </span>
                <span className="vintage-badge text-xs font-semibold">
                  {c.progressPercent}% funded
                </span>
              </div>
              <p className="text-xs" style={{ color: '#7a5a44' }}>
                {c.description}
              </p>
              <div className="w-full h-2 rounded-full bg-[#e6d7c3] overflow-hidden">
                <div
                  className="h-full"
                  style={{ width: `${c.progressPercent}%`, background: '#8c5a2b' }}
                />
              </div>
              <div className="text-xs" style={{ color: '#6b4c3b' }}>
                Raised ₹{c.raisedAmount.toLocaleString()} of ₹{c.targetAmount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {canDonate && (
        <form onSubmit={handleDonate} className="glass-card p-4 rounded-xl space-y-3 paper-edge">
          <h3 className="handwritten text-lg" style={{ color: '#6b4c3b' }}>
            Record a Contribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (INR)"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            >
              <option value="">General Welfare Fund</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Donor name"
              className="p-2 rounded border text-sm"
              style={{ background: '#fffdf7', borderColor: '#d9c2a6' }}
            />
            <button
              type="submit"
              disabled={donationMutation.isPending}
              className="btn-primary handwritten text-sm disabled:opacity-60"
            >
              {donationMutation.isPending ? 'Processing…' : 'Contribute Now'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: '#6b4c3b' }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            List contribution as Anonymous on public transparency wall
          </label>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {donors.map((d) => (
          <Card key={d.id} className="polaroid">
            <div className="handwritten font-semibold" style={{ color: '#5c4132' }}>
              {d.name}
            </div>
            <div className="text-sm mt-1" style={{ color: '#7a5a44' }}>
              Total Given: ₹{d.total.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: '#8a6b54' }}>
              {d.donationCount} contributions{d.city ? ` • ${d.city}` : ''}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}