import React from 'react'
import { motion } from 'framer-motion'
import Card from '../components/Card'

export default function ImpactShowcase(){
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl handwritten" style={{color:'#6b4c3b'}}>Impact Showcase</h2>
        <div className="handwritten">A living presentation of our impact</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-3xl font-bold handwritten" style={{color:'#6b4c3b'}}>1,240</div>
          <div className="text-sm">Lives Transformed</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold handwritten" style={{color:'#6b4c3b'}}>860</div>
          <div className="text-sm">Dreams Achieved</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold handwritten" style={{color:'#6b4c3b'}}>320</div>
          <div className="text-sm">Scholarships Earned</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="handwritten">Alumni Success Stories</h3>
          <p className="text-sm">Selected success narratives for demos and donors.</p>
        </Card>
        <Card className="p-6">
          <h3 className="handwritten">Donor Transparency</h3>
          <p className="text-sm">Impact-focused reporting and resource allocation visualization.</p>
        </Card>
      </div>
    </motion.div>
  )
}
