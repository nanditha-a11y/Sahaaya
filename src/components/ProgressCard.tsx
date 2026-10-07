import React from 'react'
import { motion } from 'framer-motion'

export default function ProgressCard({title, percent}:{title:string, percent:number}){
  const stroke = 10
  const r = 36
  const c = 2 * Math.PI * r
  const dash = c * (percent/100)
  return (
    <motion.div className="glass-card p-4 rounded-lg flex items-center gap-4" whileHover={{y:-3}}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <g transform="translate(48,48)">
          <circle r={r} stroke="#efe7de" strokeWidth={stroke} fill="none" />
          <circle r={r} stroke="#c98b5a" strokeWidth={stroke} strokeDasharray={`${dash} ${c-dash}`} strokeLinecap="round" fill="none" transform="rotate(-90)" />
        </g>
      </svg>
      <div>
        <div className="text-sm" style={{color:'#6b4c3b'}}>{title}</div>
        <div className="text-2xl font-semibold" style={{color:'#4b3628'}}>{percent}%</div>
      </div>
    </motion.div>
  )
}
