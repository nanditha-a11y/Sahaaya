import React from 'react'
import { motion } from 'framer-motion'

export default function MetricCard({title, value, icon, className}:{title:string, value:React.ReactNode, icon?:React.ReactNode, className?:string}){
  return (
    <motion.div whileHover={{y:-4}} className={`glass-card p-4 rounded-lg shadow-sm ${className||''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs" style={{color:'#6b4c3b'}}>{title}</div>
          <div className="text-2xl font-semibold" style={{color:'#4b3628'}}>{value}</div>
        </div>
        <div className="text-3xl text-vintageBrown">{icon}</div>
      </div>
    </motion.div>
  )
}
