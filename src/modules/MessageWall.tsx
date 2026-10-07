import React, { useState } from 'react'
import messages from '../data/messages.json'
import { motion } from 'framer-motion'

function Postcard({msg, idx, onOpen}:{msg:any, idx:number, onOpen:(m:any)=>void}){
  const rot = (Math.random()-0.5)*8
  const left = 10 + idx*12
  return (
    <motion.div initial={{rotate:rot-8, y:20}} animate={{rotate:rot, y:0}} whileHover={{scale:1.03}} className="absolute w-56 p-3 bg-[#fffdf7] paper-edge rounded shadow-lg" style={{left:`${left}%`, top:`${(idx%5)*10 + 8}%`, transform:`rotate(${rot}deg)`}} onClick={()=>onOpen(msg)}>
      <div className="handwritten font-semibold" style={{color:'#6b4c3b'}}>{msg.from}</div>
      <div className="text-xs mt-1" style={{color:'#4b3628'}}>{msg.text}</div>
      <div className="text-xxs mt-2 text-[#7a5a44]">{msg.role} • {msg.date}</div>
    </motion.div>
  )
}

export default function MessageWall(){
  const [open, setOpen] = useState<any>(null)

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge relative" style={{minHeight:420}}>
      <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>Message of Hope Wall</h3>
      <p className="text-sm" style={{color:'#7a5a44'}}>A corkboard of postcards pinned with love and stories.</p>

      <div className="mt-4 relative h-96 bg-[url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=')] bg-cover rounded">
        {messages.map((m:any, i:number)=>(<Postcard key={m.id} msg={m} idx={i} onOpen={setOpen} />))}
      </div>

      {open && (
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-6 glass-card rounded-xl shadow-2xl">
          <div className="handwritten text-xl" style={{color:'#6b4c3b'}}>{open.from}</div>
          <div className="text-sm mt-2" style={{color:'#4b3628'}}>{open.text}</div>
          <div className="text-xs mt-3 text-[#7a5a44]">{open.role} • {open.date}</div>
          <div className="mt-4"><button className="btn-primary" onClick={()=>setOpen(null)}>Close</button></div>
        </motion.div>
      )}
    </div>
  )
}
