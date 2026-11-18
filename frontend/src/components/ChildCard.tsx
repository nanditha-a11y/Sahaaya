import React from 'react'
import { motion } from 'framer-motion'

export default function ChildCard({name, age, progress}:{name:string, age:number, progress?:number}){
  return (
    <motion.div className="glass-card p-4 rounded-lg" whileHover={{scale:1.01}}>
      <div className="flex items-center justify-between">
        <div>
          <div className="handwritten text-lg" style={{color:'#4b3628'}}>{name}</div>
          <div className="text-sm" style={{color:'#6b4c3b'}}>{age} years</div>
        </div>
        <div className="text-sm text-slate-600">Progress: {progress ?? 0}%</div>
      </div>
    </motion.div>
  )
}
