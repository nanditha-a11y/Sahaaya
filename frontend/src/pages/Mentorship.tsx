import React from 'react'
import Card from '../components/Card'

const mentors = [
  {id:'m1', name:'Dr. Kumar', sessions:24},
  {id:'m2', name:'Ms. Iyer', sessions:18},
  {id:'m3', name:'Eng. Rao', sessions:30}
]

export default function Mentorship(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Mentorship Network</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentors.map(mt=> (
          <Card key={mt.id} className="p-4">
            <div className="handwritten font-semibold">{mt.name}</div>
            <div className="text-sm mt-2" style={{color:'#5a4433'}}>Sessions: {mt.sessions}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
