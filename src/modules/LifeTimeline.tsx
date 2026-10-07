import React, { useState } from 'react'
import events from '../data/timeline.json'
import { motion } from 'framer-motion'

export default function LifeTimeline(){
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Life Journey Timeline</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>Turn the pages of a life story — photos, awards and handwritten notes.</p>

      <div className="mt-6 overflow-x-auto py-4">
        <div className="flex gap-6 px-4">
          {events.map(ev=> (
            <motion.article key={ev.id} className="polaroid w-56 p-3" whileHover={{scale:1.03}} onClick={()=>setActive(ev.id)}>
              <img src={ev.photo} alt={ev.title} className="w-full h-36 object-cover rounded" />
              <div className="mt-2 handwritten font-semibold" style={{color:'#4b3628'}}>{ev.title} — {ev.year}</div>
              <div className="text-xs mt-1" style={{color:'#6b4c3b'}}>{ev.notes}</div>
            </motion.article>
          ))}
        </div>
      </div>

      {active && (
        <motion.div initial={{opacity:0, rotateY:-20}} animate={{opacity:1, rotateY:0}} className="mt-4 p-4 glass-card rounded-xl">
          <button className="text-sm mb-2" onClick={()=>setActive(null)}>Close</button>
          <div className="handwritten font-semibold">{events.find(e=>e.id===active)?.title}</div>
          <div className="text-sm mt-1">{events.find(e=>e.id===active)?.notes}</div>
        </motion.div>
      )}
    </div>
  )
}
