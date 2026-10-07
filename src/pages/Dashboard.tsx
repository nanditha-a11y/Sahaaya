import React from 'react'
import Card from '../components/Card'
import Metric from '../components/Metric'
import ChartArea from '../components/ChartArea'
import data from '../data/analytics.json'

export default function Dashboard(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Legacy Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><Metric value={1240} label="Lives Changed"/></Card>
        <Card><Metric value={860} label="Dreams Achieved"/></Card>
        <Card><Metric value={320} label="Scholarships"/></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="handwritten" style={{color:'#4b3628'}}>Life Journey Timeline</h3>
          <p className="text-sm">An interactive scrapbook timeline of milestones.</p>
        </Card>
        <ChartArea data={data.donationTrends} />
      </div>
    </div>
  )
}
