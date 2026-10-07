import React, { useState } from 'react'
import goalsData from '../data/dreams.json'

export default function DreamBuilder(){
  const [selected, setSelected] = useState<string | null>(null)

  const completed = goalsData.completedSkills

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Dream Builder</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>Select a dream and see the roadmap of skills and mentors.</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goalsData.goals.map((g:any)=>{
          const required = g.skills.length
          const done = g.skills.filter((s:string)=> completed.includes(s)).length
          const pct = Math.round((done/required)*100)
          return (
            <div key={g.id} className="p-4 glass-card rounded-xl paper-edge">
              <div className="flex justify-between items-center">
                <div className="handwritten font-semibold" style={{color:'#4b3628'}}>{g.title}</div>
                <button className="text-sm" onClick={()=>setSelected(g.id)}>Open</button>
              </div>
              <div className="mt-2 text-xs" style={{color:'#6b4c3b'}}>Progress: {pct}%</div>
              <div className="w-full bg-[#fff8ef] h-2 rounded mt-2 overflow-hidden" style={{border:'1px solid rgba(75,54,40,0.06)'}}>
                <div style={{width:`${pct}%`, height:'100%', background:'#c69b6d'}} />
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="mt-4 p-4 glass-card rounded-xl">
          <button className="text-sm" onClick={()=>setSelected(null)}>Close</button>
          <div className="handwritten font-semibold">{goalsData.goals.find((g:any)=>g.id===selected)?.title}</div>
          <div className="text-sm mt-2">Required Skills:</div>
          <ul className="text-sm mt-1" style={{color:'#5a4433'}}>
            {goalsData.goals.find((g:any)=>g.id===selected)?.skills.map((s:string)=>(<li key={s}>• {s}</li>))}
          </ul>
          <div className="text-sm mt-2">Suggested Mentor: {goalsData.goals.find((g:any)=>g.id===selected)?.mentors[0]}</div>
        </div>
      )}
    </div>
  )
}
