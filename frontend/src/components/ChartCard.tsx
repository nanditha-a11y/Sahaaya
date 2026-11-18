import React from 'react'

export default function ChartCard({title, children}:{title:string, children:React.ReactNode}){
  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="text-sm" style={{color:'#6b4c3b'}}>{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  )
}
