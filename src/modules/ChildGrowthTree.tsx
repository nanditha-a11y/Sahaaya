import React, { useEffect, useState } from 'react'
import treeData from '../data/tree.json'
import { motion } from 'framer-motion'

type NodeItem = { id:string; label:string; branchId?:string }

export default function ChildGrowthTree(){
  const [selected, setSelected] = useState<any>(null)
  const [grown, setGrown] = useState(false)

  useEffect(()=>{
    const t = setTimeout(()=> setGrown(true), 600)
    return ()=>clearTimeout(t)
  },[])

  const handleClick = (item:any)=> setSelected(item)

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>{treeData.name}'s Growth Tree</h3>
          <p className="text-sm" style={{color:'#7a5a44'}}>Roots are admissions, branches are skill areas, leaves are achievements.</p>
        </div>
        <div className="text-sm" style={{color:'#4b3628'}}>Grown: {grown ? 'Yes' : 'Growing...'}</div>
      </div>

      <div className="mt-6 relative">
        <svg viewBox="0 0 800 400" className="w-full h-80">
          {/* roots */}
          <motion.line x1="100" y1="380" x2="240" y2="320" stroke="#8b6a52" strokeWidth={4}
            initial={{pathLength:0}} animate={{pathLength: grown?1:0}} transition={{duration:1}}/>

          {/* trunk */}
          <motion.line x1="240" y1="320" x2="240" y2="220" stroke="#7a5238" strokeWidth={8}
            initial={{pathLength:0}} animate={{pathLength: grown?1:0}} transition={{duration:1.2}}/>

          {/* branches */}
          {treeData.branches.map((b:any, i:number)=>{
            const x = 240 + (i-1)*120
            const y = 220 - (i%2===0?40:80)
            return (
              <g key={b.id}>
                <motion.line x1="240" y1="220" x2={x} y2={y} stroke="#7a5238" strokeWidth={4}
                  initial={{pathLength:0}} animate={{pathLength: grown?1:0}} transition={{duration:1.2, delay:0.2*i}} onClick={()=>handleClick(b)} style={{cursor:'pointer'}}/>
                <motion.circle cx={x} cy={y} r={12} fill="#6b4c3b" whileHover={{scale:1.05}} onClick={()=>handleClick(b)} style={{cursor:'pointer'}}/>
                <text x={x+18} y={y+6} fontFamily="Patrick Hand, cursive" fontSize={14} fill="#4b3628">{b.label}</text>
              </g>
            )
          })}

          {/* leaves */}
          {treeData.leaves.map((l:any, idx:number)=>{
            const branchIndex = treeData.branches.findIndex((b:any)=>b.id===l.branchId)
            const x = 240 + (branchIndex-1)*120 + 30
            const y = 220 - (branchIndex%2===0?40:80) - 20 - idx*12
            return (
              <motion.ellipse key={l.id} cx={x} cy={y} rx={18} ry={10} fill="#2f6b4a" initial={{scale:0,opacity:0}} animate={{scale: grown?1:0, opacity: grown?1:0}} transition={{delay:0.6+idx*0.1}} onClick={()=>handleClick(l)} style={{cursor:'pointer'}}/>
            )
          })}

          {/* flowers */}
          {treeData.flowers.map((f:any, i:number)=> (
            <motion.g key={f.id} initial={{scale:0,opacity:0}} animate={{scale: grown?1:0, opacity: grown?1:0}} transition={{delay:0.8+i*0.15}} onClick={()=>handleClick(f)} style={{cursor:'pointer'}}>
              <circle cx={520} cy={120} r={10} fill="#e7b36a" />
              <text x={540} y={124} fontFamily="Patrick Hand, cursive" fontSize={13} fill="#4b3628">{f.label}</text>
            </motion.g>
          ))}

          {/* fruits */}
          {treeData.fruits.map((fr:any,i:number)=> (
            <motion.g key={fr.id} initial={{y:60,opacity:0}} animate={{y:0,opacity: grown?1:0}} transition={{delay:1+i*0.12}} onClick={()=>handleClick(fr)} style={{cursor:'pointer'}}>
              <circle cx={160 + i*40} cy={260} r={8} fill="#c97b4a" />
              <text x={180 + i*40} y={264} fontFamily="Patrick Hand, cursive" fontSize={12} fill="#4b3628">{fr.label}</text>
            </motion.g>
          ))}
        </svg>

        {selected && (
          <div className="absolute right-6 top-8 w-80 glass-card p-4 rounded-xl shadow-lg">
            <div className="handwritten font-semibold" style={{color:'#6b4c3b'}}>{selected.label || selected.name}</div>
            <div className="text-sm mt-2" style={{color:'#5a4433'}}>Details about this item. Click elsewhere to close.</div>
            <button className="mt-3 btn-primary" onClick={()=>setSelected(null)}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
