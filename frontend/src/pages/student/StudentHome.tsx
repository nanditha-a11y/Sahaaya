import React from 'react'
import { useQuery } from '@tanstack/react-query'
import ProfileCard from '../../components/ProfileCard'
import ProgressCard from '../../components/ProgressCard'
import ChartCard from '../../components/ChartCard'
import ChildCard from '../../components/ChildCard'
import ActivityTimeline from '../../components/ActivityTimeline'
import StatusBanner from '../../components/StatusBanner'
import { useTranslation } from '../../i18n/useTranslation'
import VintageIllustration from '../../components/VintageIllustration'
import {
  getChildren,
  getEducationOverview,
  getMentorshipOverview,
  getScholarships,
} from '../../api/client'
import { useRole } from '../../contexts/RoleContext'

export default function StudentHome() {
  const { t } = useTranslation() as any
  const { profile } = useRole()

  const childrenQuery = useQuery({
    queryKey: ['children', 'student-home'],
    queryFn: () => getChildren(),
  })

  const student = childrenQuery.data?.[0] ?? null

  const educationQuery = useQuery({
    queryKey: ['education-overview', student?.id ?? 'DEFAULT'],
    queryFn: () => getEducationOverview(student?.id),
    enabled: childrenQuery.isSuccess,
  })

  const scholarshipsQuery = useQuery({
    queryKey: ['scholarships'],
    queryFn: () => getScholarships(),
  })

  const mentorshipQuery = useQuery({
    queryKey: ['mentorship-overview'],
    queryFn: () => getMentorshipOverview(),
  })

  const education = educationQuery.data
  const scholarships = scholarshipsQuery.data ?? []
  const mentorship = mentorshipQuery.data

  const attendanceRate = education?.attendanceSummary.ratePercent ?? 95
  const recentRecords = education?.records.slice(0, 4) ?? []

  const activities =
    recentRecords.length > 0
      ? recentRecords.map((r) => ({
          time: r.term,
          title: `${r.subject} — ${r.score}%`,
          desc: r.remarks ?? `Grade ${r.grade}`,
        }))
      : [
          {
            time: 'Current',
            title: 'Active Enrollment',
            desc: student?.education ?? 'Academic track active',
          },
        ]

  const latestSession = mentorship?.sessions[0]
  const latestApp = scholarships.flatMap((s) =>
    s.applications.map((a) => ({ scholarship: s.name, status: a.status }))
  )[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2">
          <ProfileCard
            name={student?.name ?? profile?.name ?? 'Student'}
            role={
              student
                ? `${student.education} • Age ${student.age}`
                : 'Student Portal'
            }
          />
        </div>
        <div className="flex justify-end">
          <VintageIllustration
            variant="student"
            title={student?.name ?? profile?.name ?? 'Student'}
            description={t('StudentProgress')}
          />
        </div>
      </div>

      <StatusBanner
        loading={
          childrenQuery.isLoading ||
          educationQuery.isLoading ||
          scholarshipsQuery.isLoading ||
          mentorshipQuery.isLoading
        }
        loadingText="Loading student progress & mentorship records…"
        error={
          childrenQuery.isError
            ? childrenQuery.error instanceof Error
              ? childrenQuery.error.message
              : 'Unable to load student profile.'
            : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard title="Attendance" percent={attendanceRate} />
        <ChartCard title="Academic Performance">
          <div className="space-y-1 text-xs py-2" style={{ color: '#4b3628' }}>
            {recentRecords.length > 0 ? (
              recentRecords.map((r) => (
                <div key={r.id} className="flex justify-between">
                  <span>{r.subject}</span>
                  <strong>{r.score}%</strong>
                </div>
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm" style={{ color: '#7a5a44' }}>
                {student?.education ?? 'Academic records synced'}
              </div>
            )}
          </div>
        </ChartCard>
        <ChildCard
          name={student?.name ?? profile?.name ?? 'Student'}
          age={student?.age ?? 14}
          progress={attendanceRate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityTimeline events={activities} />
        </div>
        <div className="space-y-3">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm handwritten" style={{ color: '#6b4c3b' }}>
              Mentor Sessions
            </div>
            <div className="text-xs mt-2" style={{ color: '#4b3628' }}>
              {latestSession
                ? `“${latestSession.topic}” with ${latestSession.mentor.name} (${latestSession.sessionDate.slice(0, 10)})`
                : 'No mentorship sessions scheduled yet.'}
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm handwritten" style={{ color: '#6b4c3b' }}>
              Scholarship Status
            </div>
            <div className="text-xs mt-2" style={{ color: '#4b3628' }}>
              {latestApp
                ? `${latestApp.scholarship}: ${latestApp.status}`
                : `${scholarships.length} active scholarships open for application`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}