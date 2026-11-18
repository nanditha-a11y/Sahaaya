import React from 'react'

export default function ImpactCard({title, delta}:{title:string, delta:string}){
  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="text-sm" style={{color:'#6b4c3b'}}>{title}</div>
      <div className="text-2xl font-bold" style={{color:'#4b3628'}}>{delta}</div>
    </div>
  )
}
