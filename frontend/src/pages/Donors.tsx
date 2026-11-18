import React from 'react'
import Card from '../components/Card'

const donors = [
  {id:'d1', name:'R. Sharma', total:1200},
  {id:'d2', name:'Global Philanthropy', total:4200},
  {id:'d3', name:'Friends of Sahaaya', total:2300}
]

export default function Donors(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Donor Transparency</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {donors.map(d=> (
          <Card key={d.id} className="p-4">
            <div className="handwritten font-semibold">{d.name}</div>
            <div className="text-sm mt-2" style={{color:'#5a4433'}}>Total Given: ${d.total}</div>
            <div className="text-xs mt-1">Sponsor: {d.name}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
