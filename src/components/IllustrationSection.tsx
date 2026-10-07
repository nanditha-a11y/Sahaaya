import React from 'react'
import { motion } from 'framer-motion'

export default function IllustrationSection({type='generic', title, description}:{type?:string, title?:string, description?:string}){
  const float = { y:[0,-6,0], transition:{duration:4, repeat: Infinity} }
  return (
    <div className="flex items-center gap-6">
      <motion.div animate={float as any} className="w-60 h-44 bg-[linear-gradient(#fbf6f0,#f6efe6)] rounded-xl flex items-center justify-center" style={{boxShadow:'0 6px 20px rgba(0,0,0,0.04)'}}>
        {type==='landing' && (
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="20" width="120" height="70" rx="8" fill="#fff2e8" stroke="#eedfcf"/>
            <circle cx="110" cy="40" r="14" fill="#d9b08a" />
            <rect x="18" y="36" width="40" height="8" rx="2" fill="#c98b5a"/>
            <rect x="18" y="50" width="60" height="6" rx="2" fill="#f0d7c2"/>
          </svg>
        )}
        {type==='admin' && (
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="120" height="60" rx="10" fill="#fff6f0" stroke="#e6d6c6"/>
            <rect x="18" y="22" width="36" height="8" rx="3" fill="#c98b5a"/>
            <rect x="18" y="36" width="90" height="8" rx="3" fill="#f0d7c2"/>
          </svg>
        )}
        {type==='student' && (
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="120" height="60" rx="10" fill="#fff6f0" stroke="#e6d6c6"/>
            <circle cx="34" cy="40" r="12" fill="#c98b5a" />
            <rect x="52" y="30" width="56" height="10" rx="3" fill="#f0d7c2"/>
          </svg>
        )}
        {type==='donor' && (
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="10" width="120" height="60" rx="10" fill="#fff6f0" stroke="#e6d6c6"/>
            <path d="M30 60 C45 40, 80 40, 100 60" stroke="#c98b5a" strokeWidth="3" fill="none" />
            <circle cx="100" cy="50" r="6" fill="#d9b08a" />
          </svg>
        )}
      </motion.div>
      <div>
        {title && <div className="handwritten text-xl" style={{color:'#4b3628'}}>{title}</div>}
        {description && <div className="text-sm mt-1" style={{color:'#6b4c3b'}}>{description}</div>}
      </div>
    </div>
  )
}
