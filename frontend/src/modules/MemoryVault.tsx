import React, { useState } from 'react'
import vault from '../data/vault.json'
import { motion } from 'framer-motion'

export default function MemoryVault(){
  const [filter, setFilter] = useState<string>('all')
  const [open, setOpen] = useState<any>(null)

  const items = vault.items.filter((it:any)=> filter==='all' ? true : it.type===filter)

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Memory Vault</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>A curated scrapbook archive with search and flipbook viewing.</p>

      <div className="mt-4 flex gap-3">
        <button className="px-3 py-1 rounded" onClick={()=>setFilter('all')}>All</button>
        <button className="px-3 py-1 rounded" onClick={()=>setFilter('photo')}>Photos</button>
        <button className="px-3 py-1 rounded" onClick={()=>setFilter('certificate')}>Certificates</button>
        <button className="px-3 py-1 rounded" onClick={()=>setFilter('drawing')}>Drawings</button>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it:any)=>(
          <motion.div key={it.id} className="polaroid p-2" whileHover={{scale:1.03}} onClick={()=>setOpen(it)} style={{cursor:'pointer'}}>
            <img src={it.src} alt={it.title} className="w-full h-40 object-cover rounded" />
            <div className="mt-2 handwritten" style={{color:'#4b3628'}}>{it.title}</div>
            <div className="text-xs" style={{color:'#6b4c3b'}}>{it.type}</div>
          </motion.div>
        ))}
      </div>

      {open && (
        <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-3xl p-6 glass-card rounded-xl shadow-2xl">
          <div className="flex gap-6">
            <img src={open.src} className="w-60 h-60 object-cover border-4 border-[#efe0c8]" />
            <div>
              <div className="handwritten text-2xl" style={{color:'#6b4c3b'}}>{open.title}</div>
              <div className="text-sm mt-2" style={{color:'#4b3628'}}>{open.desc}</div>
              <div className="mt-4"><button className="btn-primary" onClick={()=>setOpen(null)}>Close</button></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
