import React from 'react'
import Card from '../components/Card'

const scholarships = [
  {id:'s1', name:'Merit Scholarship', awarded:45},
  {id:'s2', name:'STEM Grant', awarded:12},
  {id:'s3', name:'Arts Fellowship', awarded:8}
]

export default function Scholarships(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Scholarships & Career Hub</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scholarships.map(s=> (
          <Card key={s.id} className="p-4">
            <div className="handwritten font-semibold">{s.name}</div>
            <div className="text-sm mt-2" style={{color:'#5a4433'}}>Awarded: {s.awarded}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
