import React from 'react'
import { motion } from 'framer-motion'

type Props = {
  variant?: 'landing'|'admin'|'student'|'donor'|'small'
  title?: string
  description?: string
}

export default function VintageIllustration({variant='landing', title, description}:Props){
  const float = { y:[0,-4,0], transition:{duration:5, repeat: Infinity} }
  return (
    <div className="flex items-center gap-4">
      <motion.div animate={float as any} className={`vintage-illustration p-3 rounded-xl`}>
        <svg width="220" height={variant==='small'?80:140} viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="216" height="136" rx="12" fill="#fffaf3" stroke="#eaddcf"/>
          {/* hand-drawn group */}
          <g stroke="#7a4f35" strokeWidth="1.2" fill="#f7e9dd">
            {variant==='landing' && (
              <>
                <path d="M30 100 q20 -30 60 -20 q20 6 40 -6 q20 -12 50 12" fill="#f7e6d9" stroke="#7a4f35"/>
                <circle cx="60" cy="60" r="10" fill="#d9b08a" />
                <rect x="80" y="50" width="50" height="8" rx="2" fill="#e8d2bf" />
                <path d="M30 110 q40 -18 80 -18 q40 0 60 10" stroke="#7a4f35" fill="none"/>
              </>
            )}
            {variant==='admin' && (
              <>
                <rect x="24" y="36" width="68" height="10" rx="2" fill="#e8d2bf" />
                <rect x="24" y="52" width="140" height="8" rx="2" fill="#f1dcc6" />
                <path d="M20 100 q40 -22 180 0" stroke="#7a4f35" fill="none"/>
              </>
            )}
            {variant==='student' && (
              <>
                <circle cx="46" cy="56" r="12" fill="#d9b08a"/>
                <rect x="70" y="44" width="70" height="10" rx="2" fill="#f1dcc6" />
                <path d="M20 100 q30 -20 70 -10 q40 12 80 10" stroke="#7a4f35" fill="none"/>
              </>
            )}
            {variant==='donor' && (
              <>
                <path d="M30 70 q30 -20 80 -6 q40 12 60 6" stroke="#7a4f35" fill="#f3e2d2" />
                <circle cx="160" cy="48" r="8" fill="#c98b5a" />
                <path d="M20 100 q50 -20 180 0" stroke="#7a4f35" fill="none"/>
              </>
            )}
          </g>
          {/* decorative corner */}
          <path d="M12 18 q8 -6 20 0" stroke="#e0c9b1" strokeWidth="1.2" fill="none" />
        </svg>
      </motion.div>
      <div className="hidden sm:block max-w-xs">
        {title && <div className="handwritten text-lg" style={{color:'#4b3628'}}>{title}</div>}
        {description && <div className="text-sm mt-1" style={{color:'#6b4c3b'}}>{description}</div>}
      </div>
    </div>
  )
}
