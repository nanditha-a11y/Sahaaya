import React from 'react'
import { motion } from 'framer-motion'

export default function Card({children,className}:{children:React.ReactNode,className?:string}){
  return (
    <motion.figure whileHover={{ rotate: -1, y: -6 }} className={`polaroid ${className || ''}`}>
      {children}
    </motion.figure>
  )
}
