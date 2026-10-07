import React from 'react'
import WellnessRadar from '../modules/WellnessRadar'
import Card from '../components/Card'

export default function Health(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Health & Wellness</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WellnessRadar />
        <Card className="p-4">
          <div className="handwritten font-semibold">Medical Records</div>
          <ul className="mt-3 text-sm" style={{color:'#5a4433'}}>
            <li>• Last Checkup: 2025-03-12</li>
            <li>• Vaccinations: Up-to-date</li>
            <li>• Nutrition Status: Healthy</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
