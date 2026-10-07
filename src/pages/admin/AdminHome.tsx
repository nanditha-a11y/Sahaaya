import React from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import VintageIllustration from '../../components/VintageIllustration'
import MetricCard from '../../components/MetricCard'
import ProfileCard from '../../components/ProfileCard'
import ProgressCard from '../../components/ProgressCard'
import ActivityTimeline from '../../components/ActivityTimeline'
import ImpactCard from '../../components/ImpactCard'
import ChartCard from '../../components/ChartCard'
import ChildCard from '../../components/ChildCard'

export default function AdminHome(){
  const { t } = useTranslation() as any
  const metrics = { totalChildren:128, programs:12, donors:54, resources:342, scholarships:23 }
  const activities = [
    {time:'2h', title:'New admission: Aarav', desc:'Registered under education program'},
    {time:'1d', title:'Donation received', desc:'₹50,000 via bank transfer'},
    {time:'3d', title:'Health camp completed', desc:'Vaccinations and checkups for 45 children'}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>{t('WelcomeBackAdmin')}</h2>
          <div className="text-sm" style={{color:'#4b3628'}}>{t('OverviewLine')}</div>
        </div>
        <div className="flex justify-end">
          <ProfileCard name="Admin" role="Sahaaya Manager" />
        </div>
      </div>
      <div className="mt-4">
        <VintageIllustration variant="admin" title={t('EmpoweringTitle')} description={t('OverviewLine')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Children" value={metrics.totalChildren} />
        <MetricCard title="Active Programs" value={metrics.programs} />
        <MetricCard title="Donors Connected" value={metrics.donors} />
        <MetricCard title="Resources Available" value={metrics.resources} />
        <MetricCard title="Scholarships" value={metrics.scholarships} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Child Welfare Overview">
          <div className="h-40 flex items-center justify-center text-slate-500">[Placeholder chart]</div>
        </ChartCard>
        <div className="space-y-4 lg:col-span-2">
          <ProgressCard title="Education Progress" percent={72} />
          <ActivityTimeline events={activities} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ImpactCard title="Education" delta="+25%" />
        <ImpactCard title="Health Records" delta="+30%" />
        <ImpactCard title="Resource Efficiency" delta="+40%" />
      </div>

      <div>
        <h3 className="handwritten text-lg" style={{color:'#6b4c3b'}}>Recent Children</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          <ChildCard name="Aarav" age={7} progress={45} />
          <ChildCard name="Meera" age={10} progress={80} />
          <ChildCard name="Rohan" age={9} progress={60} />
          <ChildCard name="Anya" age={8} progress={70} />
        </div>
      </div>
    </div>
  )
}
