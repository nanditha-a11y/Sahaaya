import React, { useEffect, useState } from 'react'
import { DashboardStats, getDashboardStats } from '../../api/client'
import { useTranslation } from '../../i18n/useTranslation'
import MetricCard from '../../components/MetricCard'
import ChildCard from '../../components/ChildCard'
import ChartCard from '../../components/ChartCard'
import ActivityTimeline from '../../components/ActivityTimeline'
import VintageIllustration from '../../components/VintageIllustration'

export default function DonorHome(){
  const { t } = useTranslation() as any
  const [totalDonations, setTotalDonations] = useState('$7,800')

  useEffect(() => {
    let active = true
    const fallbackStats: DashboardStats = {
      children: 92,
      donations: { count: 0, total: 7800 },
      resources: { count: 0, totalStock: 0 },
      messages: 0
    }

    getDashboardStats(fallbackStats).then(stats => {
      if (active) {
        setTotalDonations(`$${stats.donations.total.toLocaleString('en-US')}`)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const activities = [
    {time:'1mo', title:'School kits distributed', desc:'Provided to 30 children'},
    {time:'2mo', title:'Scholarship awarded', desc:'3 students received STEM grants'}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>{t('ThankYouDonate')}</h2>
          <div className="text-sm" style={{color:'#4b3628'}}>{t('OverviewLine')}</div>
        </div>
        <div className="flex justify-end">
          <VintageIllustration variant="donor" title={t('ThankYouDonate')} description={t('EmpoweringTitle')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Donations" value={totalDonations} />
        <MetricCard title="Children Impacted" value={92} />
        <MetricCard title="Scholarships Supported" value={12} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Donation Trends"><div className="h-36 flex items-center justify-center text-slate-500">[Trend chart]</div></ChartCard>
        <div className="lg:col-span-2">
          <ActivityTimeline events={activities} />
        </div>
      </div>

      <div>
        <h3 className="handwritten text-lg" style={{color:'#6b4c3b'}}>Success Stories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <ChildCard name="Ravi" age={14} progress={85} />
          <ChildCard name="Sana" age={16} progress={92} />
        </div>
      </div>
    </div>
  )
}
