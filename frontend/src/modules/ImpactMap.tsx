import React, { useState } from 'react'
import locations from '../data/locations.json'
import { motion } from 'framer-motion'

function Pin({item, onHover}:{item:any,onHover:(i:any)=>void}){
  return (
    <motion.div initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}} whileHover={{scale:1.1}} className="absolute" style={{left:`${item.x}%`, top:`${item.y}%`, translate:'-50% -50%'}} onMouseEnter={()=>onHover(item)}>
      <div className="w-3 h-3 rounded-full bg-[#6b4c3b] shadow" />
    </motion.div>
  )
}

export default function ImpactMap(){
  const [hovered, setHovered] = useState<any>(null)

  const all = [...locations.orphanages, ...locations.donors, ...locations.alumni, ...locations.mentors]

  return (
    <div className="glass-card p-6 rounded-2xl paper-edge relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="handwritten text-2xl" style={{color:'#6b4c3b'}}>India Impact Map</h3>
          <p className="text-sm" style={{color:'#7a5a44'}}>Vintage explorer map showing our network across India.</p>
        </div>
        <div className="text-sm" style={{color:'#4b3628'}}>Connections: {all.length}</div>
      </div>

      <div className="mt-4 flex gap-6">
        <div className="w-2/3 relative bg-[url('https://upload.wikimedia.org/wikipedia/commons/1/17/India_location_map.svg')] bg-contain bg-no-repeat bg-center rounded-xl" style={{height:360}}>
          {/* render pins */}
          {all.map((it:any)=> <Pin key={it.id} item={it} onHover={setHovered} />)}

          {/* animated connection lines to center */}
          {all.map((it:any, idx:number)=> (
            <svg key={it.id} className="absolute left-0 top-0 w-full h-full pointer-events-none">
              <motion.line x1={`${locations.center.x}%`} y1={`${locations.center.y}%`} x2={`${it.x}%`} y2={`${it.y}%`} stroke="#8b6a52" strokeWidth={1} initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:0.05*idx}} strokeOpacity={0.6} />
            </svg>
          ))}
        </div>

        <div className="w-1/3 space-y-3">
          <div className="glass-card p-3 rounded-lg">
            <div className="handwritten font-semibold" style={{color:'#6b4c3b'}}>Statistics</div>
            <div className="mt-2 text-sm" style={{color:'#5a4433'}}>Orphanages: {locations.orphanages.length}</div>
            <div className="text-sm" style={{color:'#5a4433'}}>Donors: {locations.donors.length}</div>
            <div className="text-sm" style={{color:'#5a4433'}}>Alumni: {locations.alumni.length}</div>
            <div className="text-sm" style={{color:'#5a4433'}}>Mentors: {locations.mentors.length}</div>
          </div>

          <div className="glass-card p-3 rounded-lg">
            <div className="handwritten font-semibold" style={{color:'#6b4c3b'}}>Hovered</div>
            {hovered ? (
              <div className="mt-2 text-sm" style={{color:'#5a4433'}}>
                <div className="font-semibold">{hovered.name}</div>
                <div>{hovered.city}</div>
                <div className="text-xs mt-1">{hovered.info}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{color:'#5a4433'}}>Hover a pin to see details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
