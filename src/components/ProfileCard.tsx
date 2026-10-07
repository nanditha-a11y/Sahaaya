import React from 'react'
import { motion } from 'framer-motion'

export default function ProfileCard({name, role, avatar, children}:{name:string, role?:string, avatar?:string, children?:React.ReactNode}){
  return (
    <motion.div className="glass-card p-4 rounded-lg flex items-center gap-4" whileHover={{scale:1.01}}>
      <div className="w-16 h-16 rounded-full bg-[#f3e9df] flex items-center justify-center" style={{boxShadow:'inset 0 1px 0 rgba(0,0,0,0.03)'}}>
        {avatar? <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover"/> : <div className="handwritten">🙂</div>}
      </div>
      <div>
        <div className="handwritten text-lg" style={{color:'#4b3628'}}>{name}</div>
        <div className="text-sm" style={{color:'#6b4c3b'}}>{role}</div>
        <div className="mt-2 text-xs text-slate-600">{children}</div>
      </div>
    </motion.div>
  )
}
