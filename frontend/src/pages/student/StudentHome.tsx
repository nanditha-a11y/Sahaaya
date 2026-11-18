import React, { useEffect, useState } from 'react'
import { getChildren } from '../../api/client'
import { useTranslation } from '../../i18n/useTranslation'
import ProfileCard from '../../components/ProfileCard'
import ProgressCard from '../../components/ProgressCard'
import ActivityTimeline from '../../components/ActivityTimeline'
import ChildCard from '../../components/ChildCard'
import ChartCard from '../../components/ChartCard'
import VintageIllustration from '../../components/VintageIllustration'

const studentName = 'Meera'

export default function StudentHome(){
  const { t } = useTranslation() as any
  const [student, setStudent] = useState({ name: studentName, age: 10 })

  useEffect(() => {
    let active = true
    getChildren([]).then(children => {
      const matchingStudent = children.find(
        child => child.name.toLocaleLowerCase() === studentName.toLocaleLowerCase()
      )
      if (active && matchingStudent) {
        setStudent({ name: matchingStudent.name, age: matchingStudent.age })
      }
    })

    return () => {
      active = false
    }
  }, [])

  const activities = [
    {time:'Tomorrow', title:'Math Class', desc:'Practice times tables'},
    {time:'Friday', title:'Library Hour', desc:'Read "The Little Prince"'},
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <h2 className="text-2xl handwritten" style={{color:'#6b4c3b'}}>{t('KeepLearning')}</h2>
          <div className="text-sm" style={{color:'#4b3628'}}>{t('OverviewLine')}</div>
        </div>
        <div className="flex justify-end">
          <ProfileCard name={student.name} role="Student" />
        </div>
      </div>
      <div className="mt-4">
        <VintageIllustration variant="student" title={t('KeepLearning')} description={t('EmpoweringTitle')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ProgressCard title="Learning Progress" percent={68} />
        <ChartCard title="Recent Grades"><div className="h-28 flex items-center justify-center text-slate-500">[Grades chart]</div></ChartCard>
        <div className="space-y-4">
          <ChildCard name={student.name} age={student.age} progress={68} />
          <ActivityTimeline events={activities} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Mentor Messages"> <div className="h-28">You have a new message from Ms. Iyer.</div></ChartCard>
        <ChartCard title="Scholarship Status"> <div className="h-28">Eligible for Arts Fellowship</div></ChartCard>
      </div>
    </div>
  )
}
