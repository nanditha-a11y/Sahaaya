import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Metric from '../components/Metric'
import StatusBanner from '../components/StatusBanner'
import { getDashboardStats, getEducationOverview } from '../api/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
  })

  const educationQuery = useQuery({
    queryKey: ['education-overview', 'ALL'],
    queryFn: () => getEducationOverview(),
  })

  const stats = statsQuery.data
  const chartData = (educationQuery.data?.monthlyTrend ?? []).map((item) => ({
    name: item.month,
    value: item.score,
  }))

  return (
    <div className="space-y-6">
      <StatusBanner
        loading={statsQuery.isLoading || educationQuery.isLoading}
        loadingText="Loading live impact metrics…"
        error={
          statsQuery.isError
            ? statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Unable to load dashboard.'
            : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Children Supported" value={stats ? stats.children : '—'} />
        <Metric
          label="Total Donations"
          value={stats ? `₹${stats.donations.total.toLocaleString()}` : '—'}
        />
        <Metric label="Resources in Stock" value={stats ? stats.resources.totalStock : '—'} />
      </div>

      <div className="glass-card p-6 rounded-2xl paper-edge">
        <h3 className="text-lg font-medium mb-4 handwritten" style={{ color: '#6b4c3b' }}>
          Academic Growth & Progress Trend
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" stroke="#9b7b63" />
              <YAxis stroke="#9b7b63" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#a66a3c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}