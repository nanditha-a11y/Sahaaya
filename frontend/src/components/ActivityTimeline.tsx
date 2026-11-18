import React from 'react'

export default function ActivityTimeline({events}:{events:Array<{time:string, title:string, desc?:string}>}){
  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="text-sm handwritten" style={{color:'#6b4c3b'}}>Recent Activities</div>
      <ul className="mt-3 space-y-3">
        {events.map((e, idx)=> (
          <li key={idx} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-[#c98b5a] mt-2" />
            <div>
              <div className="text-sm font-semibold" style={{color:'#4b3628'}}>{e.title} <span className="text-xs text-slate-500">· {e.time}</span></div>
              <div className="text-xs text-slate-600">{e.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
