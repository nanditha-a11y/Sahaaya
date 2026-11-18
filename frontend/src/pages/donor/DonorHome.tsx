import React from 'react'
import { useQuery } from '@tanstack/react-query'
import MetricCard from '../../components/MetricCard'
import ChartCard from '../../components/ChartCard'
import ChildCard from '../../components/ChildCard'
import ActivityTimeline from '../../components/ActivityTimeline'
import StatusBanner from '../../components/StatusBanner'
import { useTranslation } from '../../i18n/useTranslation'
import VintageIllustration from '../../components/VintageIllustration'
import { getChildren, getDashboardStats, getDonorsOverview } from '../../api/client'

export default function DonorHome() {
  const { t } = useTranslation() as any

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
  })

  const donorsQuery = useQuery({
    queryKey: ['donors-overview'],
    queryFn: () => getDonorsOverview(),
  })

  const childrenQuery = useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => getChildren(),
  })

  const stats = statsQuery.data
  const overview = donorsQuery.data
  const children = childrenQuery.data ?? []

  const totalDonations = stats ? `₹${stats.donations.total.toLocaleString()}` : '—'
  const myDonationTotal =
    overview && overview.myDonations.length > 0
      ? overview.myDonations.reduce((sum, d) => sum + d.amount, 0)
      : null

  const activities =
    overview && overview.myDonations.length > 0
      ? overview.myDonations.slice(0, 4).map((d) => ({
          time: d.donatedAt.slice(0, 10),
          title: `Contributed ₹${d.amount.toLocaleString()}`,
          desc: d.campaign?.title ?? 'General Welfare Fund',
        }))
      : (overview?.campaigns ?? []).slice(0, 3).map((c) => ({
          time: `${c.progressPercent}%`,
          title: c.title,
          desc: `₹${c.raisedAmount.toLocaleString()} raised of ₹${c.targetAmount.toLocaleString()}`,
        }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <h2 className="text-2xl handwritten" style={{ color: '#6b4c3b' }}>
            {t('ThankYouDonate')}
          </h2>
          <div className="text-sm" style={{ color: '#4b3628' }}>
            {t('OverviewLine')}
          </div>
        </div>
        <div className="flex justify-end">
          <VintageIllustration
            variant="donor"
            title={t('ThankYouDonate')}
            description={t('EmpoweringTitle')}
          />
        </div>
      </div>

      <StatusBanner
        loading={statsQuery.isLoading || donorsQuery.isLoading || childrenQuery.isLoading}
        loadingText="Loading donor impact summary…"
        error={
          statsQuery.isError
            ? statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Unable to load donor dashboard.'
            : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title={myDonationTotal !== null ? 'Your Contributions' : 'Total Donations'}
          value={
            myDonationTotal !== null ? `₹${myDonationTotal.toLocaleString()}` : totalDonations
          }
        />
        <MetricCard title="Children Impacted" value={stats ? stats.children : '—'} />
        <MetricCard
          title="Active Campaigns"
          value={overview ? overview.campaigns.length : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Fund Allocation & Campaign Progress">
            <div className="space-y-3 py-2">
              {(overview?.campaigns ?? []).map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: '#4b3628' }}>
                    <span className="font-semibold">{c.title}</span>
                    <span>
                      ₹{c.raisedAmount.toLocaleString()} / ₹{c.targetAmount.toLocaleString()} (
                      {c.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#e6d7c3] overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${c.progressPercent}%`, background: '#8c5a2b' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
        <div>
          <ActivityTimeline events={activities} />
        </div>
      </div>

      <div>
        <h3 className="handwritten text-xl mb-3" style={{ color: '#6b4c3b' }}>
          Children Supported
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {children.slice(0, 6).map((c) => (
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