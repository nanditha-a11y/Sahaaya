import React from 'react'
import VintageIllustration from './VintageIllustration'

export default function EmptyState({title, desc}:{title:string, desc?:string}){
  return (
    <div className="glass-card p-6 rounded-lg text-center">
      <div className="mx-auto mb-3">
        <VintageIllustration variant="landing" />
      </div>
      <div className="text-lg handwritten mt-3" style={{color:'#4b3628'}}>{title}</div>
      {desc && <div className="text-sm mt-2 text-slate-600">{desc}</div>}
    </div>
  )
}

