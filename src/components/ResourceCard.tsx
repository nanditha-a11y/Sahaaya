import React from 'react'

export default function ResourceCard({name, count}:{name:string, count:number}){
  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="text-sm" style={{color:'#6b4c3b'}}>{name}</div>
      <div className="text-2xl font-bold" style={{color:'#4b3628'}}>{count}</div>
    </div>
  )
}
