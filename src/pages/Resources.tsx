import React from 'react'
import Card from '../components/Card'

const inventory = [
  {id:'r1', name:'Textbooks', stock:120, low:20},
  {id:'r2', name:'Laptops', stock:12, low:3},
  {id:'r3', name:'Uniforms', stock:80, low:15},
  {id:'r4', name:'Medicines', stock:40, low:10}
]

export default function Resources(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Resource Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.map(it=> (
          <Card key={it.id} className="p-4">
            <div className="handwritten font-semibold">{it.name}</div>
            <div className="text-sm mt-2" style={{color:'#5a4433'}}>Stock: {it.stock}</div>
            <div className="text-xs mt-1">Low threshold: {it.low}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
