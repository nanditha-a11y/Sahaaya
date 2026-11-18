import React from 'react'
import Card from '../components/Card'
import Metric from '../components/Metric'
import { motion } from 'framer-motion'

export default function Landing(){
  return (
    <div className="space-y-8">
      <section className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold handwritten" style={{color:'#6b4c3b'}}>Every Child Deserves a Brighter Tomorrow</h1>
          <p className="mt-4" style={{color:'#4b3628'}}>Sahaaya helps orphanages manage child welfare, education, health, resources, donations, and future opportunities through a transparent digital platform.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-4 glass-card rounded-xl">
              <div className="handwritten text-xl" style={{color:'#6b4c3b'}}>Lives Supported</div>
              <div className="text-2xl font-bold">1,240</div>
            </div>
            <div className="p-4 glass-card rounded-xl">
              <div className="handwritten text-xl" style={{color:'#6b4c3b'}}>Active Donors</div>
              <div className="text-2xl font-bold">860</div>
            </div>
            <div className="p-4 glass-card rounded-xl">
              <div className="handwritten text-xl" style={{color:'#6b4c3b'}}>Scholarships Awarded</div>
              <div className="text-2xl font-bold">320</div>
            </div>
            <div className="p-4 glass-card rounded-xl">
              <div className="handwritten text-xl" style={{color:'#6b4c3b'}}>Resources Distributed</div>
              <div className="text-2xl font-bold">4,500</div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-primary handwritten">Request Demo</button>
            <button className="px-4 py-2 rounded-xl bg-[#fff8ef]" style={{border:'1px solid rgba(75,54,40,0.06)'}}>Explore Platform</button>
          </div>
        </div>
        <div>
          <Card>
            <div className="grid grid-cols-1 gap-4">
              <div className="handwritten" style={{color:'#6b4c3b'}}>Lives Cherished</div>
              <div className="text-sm" style={{color:'#5a4433'}}>A living archive of memories, milestones and handwritten notes.</div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold handwritten">Life Timeline</h3>
          <p className="mt-2">Interactive scrapbook timeline of major events and photos.</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold handwritten">Child Growth Tree</h3>
          <p className="mt-2">Visual tree of achievements and milestones.</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold handwritten">Message of Hope Wall</h3>
          <p className="mt-2">Postcards and notes from donors and mentors.</p>
        </Card>
      </section>
    </div>
  )
}
