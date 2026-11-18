import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'

const data = [
  {month:'Jan', score:65}, {month:'Feb', score:68}, {month:'Mar', score:70}, {month:'Apr', score:74}, {month:'May', score:78}, {month:'Jun', score:82}
]

export default function Education(){
  return (
    <div className="space-y-6">
      <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>Education Tracking</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="handwritten font-semibold">Attendance & Scores</div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="month" stroke="#7a5a44" />
                <YAxis stroke="#7a5a44" />
                <Tooltip />
                <Line dataKey="score" stroke="#2f6b4a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="handwritten font-semibold">Courses & Certifications</div>
          <ul className="mt-3 text-sm" style={{color:'#5a4433'}}>
            <li>• Foundation Literacy Program — Completed</li>
            <li>• Basic Computer Course — In Progress</li>
            <li>• Mathematics Enrichment — Completed</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
