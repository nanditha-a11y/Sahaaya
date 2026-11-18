import React, { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function Metric({value,label}:{value:number,label:string}){
  const [num,setNum] = useState(0)
  useEffect(()=>{
    let start = 0
    const dur = 1200
    const diff = value - start
    const step = 16
    let elapsed = 0
    const id = setInterval(()=>{
      elapsed += step
      const progress = Math.min(1, elapsed / dur)
      setNum(Math.round(start + diff * progress))
      if(progress>=1) clearInterval(id)
    }, step)
    return ()=> clearInterval(id)
  },[value])

  return (
    <div className="flex flex-col">
      <div className="text-3xl font-bold" style={{color:'#6b4c3b'}}>{num}</div>
      <div className="text-sm" style={{color:'#4b3628'}}>{label}</div>
    </div>
  )
}
