import React from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

const data = [
  {subject: 'Education', A: 85},
  {subject: 'Health', A: 70},
  {subject: 'Emotional', A: 78},
  {subject: 'Social', A: 72},
  {subject: 'Creativity', A: 88},
  {subject: 'Leadership', A: 65}
]

export default function WellnessRadar(){
  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Wellness Radar</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>Balanced view of educational, health and social development.</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={100} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{fontFamily:'Patrick Hand', fill:'#4b3628'}} />
            <PolarRadiusAxis angle={30} domain={[0,100]} />
            <Radar name="Score" dataKey="A" stroke="#2f6b4a" fill="#2f6b4a" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
