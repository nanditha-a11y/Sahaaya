import React from 'react'
import childrenData from '../data/children.json'
import Card from '../components/Card'

export default function ChildManagement(){
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Stories & Memories</h2>
        <div>
          <button className="btn-primary handwritten">Add Memory</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenData.map(child => (
          <Card key={child.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 overflow-hidden rounded-md paper-edge">
                <img src={child.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-semibold handwritten" style={{color:'#4b3628'}}>{child.name} — {child.age}</div>
                <div className="text-sm" style={{color:'#6b4c3b'}}>{child.education} • {child.health}</div>
                <div className="text-xs mt-2" style={{color:'#7a5a44'}}>Tap to open scrapbook →</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
