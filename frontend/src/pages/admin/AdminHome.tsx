import React from 'react'
import { useQuery } from '@tanstack/react-query'
import MetricCard from '../../components/MetricCard'
import ChildCard from '../../components/ChildCard'
import StatusBanner from '../../components/StatusBanner'
import { getChildren, getDashboardStats } from '../../api/client'

export default function AdminHome() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
  })

  const childrenQuery = useQuery({
    queryKey: ['children', 'recent'],
    queryFn: () => getChildren(),
  })

  const stats = statsQuery.data
  const recentChildren = (childrenQuery.data ?? []).slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="handwritten text-3xl" style={{ color: '#4b3628' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: '#6b4c3b' }}>
            Overview of children, donations, and inventory
          </p>
        </div>
      </div>

      <StatusBanner
        loading={statsQuery.isLoading || childrenQuery.isLoading}
        loadingText="Syncing live organization metrics…"
        error={
          statsQuery.isError
            ? statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Unable to load dashboard stats.'
            : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Children" value={stats ? stats.children : '—'} />
        <MetricCard
          title="Donations"
          value={stats ? `₹${stats.donations.total.toLocaleString()}` : '—'}
        />
        <MetricCard title="Resources" value={stats ? stats.resources.totalStock : '—'} />
      </div>

      <div className="space-y-3">
        <h2 className="handwritten text-xl" style={{ color: '#4b3628' }}>
          Recent Children
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentChildren.map((c) => (
            <ChildCard
              key={c.id}
              name={c.name}
              age={c.age}
              progress={Math.min(100, 75 + (c.age % 20))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}