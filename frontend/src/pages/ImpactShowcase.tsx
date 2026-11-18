import React from 'react'
import { useQuery } from '@tanstack/react-query'
import ImpactCard from '../components/ImpactCard'
import StatusBanner from '../components/StatusBanner'
import { getDashboardStats, getDonorsOverview } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ImpactShowcase() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
  })

  const donorsQuery = useQuery({
    queryKey: ['donors-overview'],
    queryFn: () => getDonorsOverview(),
  })

  const stats = statsQuery.data
  const campaigns = donorsQuery.data?.campaigns ?? []

  const chartData = campaigns.map((c) => ({
    name: c.title.split(' ').slice(0, 2).join(' '),
    raised: c.raisedAmount,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl handwritten" style={{ color: '#6b4c3b' }}>
          Donor Impact Showcase
        </h2>
        <p className="text-sm" style={{ color: '#7a5a44' }}>
          Live transparency into Sahaaya care, education, and campaign milestones.
        </p>
      </div>

      <StatusBanner
        loading={statsQuery.isLoading || donorsQuery.isLoading}
        loadingText="Loading live impact records…"
        error={
          statsQuery.isError
            ? statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Unable to load impact metrics.'
            : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImpactCard
          title="Children Supported"
          delta={stats ? `${stats.children} active` : '—'}
        />
        <ImpactCard
          title="Total Contributions"
          delta={stats ? `₹${stats.donations.total.toLocaleString()}` : '—'}
        />
        <ImpactCard
          title="Resources Distributed"
          delta={stats ? `${stats.resources.totalStock} units` : '—'}
        />
      </div>

      <div className="glass-card p-6 rounded-2xl paper-edge">
        <h3 className="text-lg font-medium mb-4 handwritten" style={{ color: '#6b4c3b' }}>
          Campaign Funding Progress (INR)
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9b7b63" />
              <YAxis stroke="#9b7b63" />
              <Tooltip />
              <Bar dataKey="raised" fill="#a66a3c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}