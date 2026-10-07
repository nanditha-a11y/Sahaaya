import React, { useState } from 'react'
import alumni from '../data/alumni.json'
import { motion } from 'framer-motion'

export default function AlumniMuseum(){
  const [open, setOpen] = useState<any>(null)

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Alumni Success Museum</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>A curated gallery of framed success stories and career journeys.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumni.map((a:any)=>(
          <motion.figure whileHover={{scale:1.03}} key={a.id} className="glass-card p-3 rounded-lg paper-edge" onClick={()=>setOpen(a)} style={{cursor:'pointer'}}>
            <div className="border-4 border-[#efe0c8] p-1">
              <img src={a.photo} className="w-full h-44 object-cover" />
            </div>
            <div className="mt-3 handwritten font-semibold" style={{color:'#4b3628'}}>{a.name}</div>
            <div className="text-sm" style={{color:'#6b4c3b'}}>{a.title}</div>
          </motion.figure>
        ))}
      </div>

      {open && (
        <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-3xl p-6 glass-card rounded-xl shadow-2xl">
          <div className="flex gap-6">
            <img src={open.photo} className="w-40 h-40 object-cover border-4 border-[#efe0c8]" />
            <div>
              <div className="handwritten text-2xl" style={{color:'#6b4c3b'}}>{open.name}</div>
              <div className="text-sm mt-2" style={{color:'#4b3628'}}>{open.story}</div>
              <div className="mt-3 text-sm" style={{color:'#5a4433'}}>
                <div className="font-semibold">Achievements</div>
                <ul className="mt-1">
                  {open.achievements.map((ach:string)=> <li key={ach}>• {ach}</li>)}
                </ul>
              </div>
              <div className="mt-3 text-sm" style={{color:'#5a4433'}}>
                <div className="font-semibold">Career Timeline</div>
                <ul className="mt-1">
                  {open.timeline.map((t:any)=> <li key={t.year}>{t.year} — {t.note}</li>)}
                </ul>
              </div>
              <div className="mt-4"><button className="btn-primary" onClick={()=>setOpen(null)}>Close</button></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
