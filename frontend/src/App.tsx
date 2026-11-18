import React, { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from './pages/Landing'
import RoleSelector from './pages/RoleSelector'
import AuthPage from './pages/auth/AuthPage'
import AdminPortal from './pages/portals/AdminPortal'
import StudentPortal from './pages/portals/StudentPortal'
import DonorPortal from './pages/portals/DonorPortal'
import { RoleProvider } from './contexts/RoleContext'
import RequireRole from './components/RequireRole'
import Dashboard from './pages/Dashboard'
import ChildManagement from './pages/ChildManagement'
import ChildGrowthTree from './modules/ChildGrowthTree'
import LifeTimeline from './modules/LifeTimeline'
import DreamBuilder from './modules/DreamBuilder'
import MentorMarketplace from './modules/MentorMarketplace'
import MessageWall from './modules/MessageWall'
import WellnessRadar from './modules/WellnessRadar'
import AlumniMuseum from './modules/AlumniMuseum'
import ImpactMap from './modules/ImpactMap'
import LegacyDashboard from './modules/LegacyDashboard'
import MemoryVault from './modules/MemoryVault'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ImpactShowcase from './pages/ImpactShowcase'
import Education from './pages/Education'
import Health from './pages/Health'
import Resources from './pages/Resources'
import Donors from './pages/Donors'
import Scholarships from './pages/Scholarships'
import Mentorship from './pages/Mentorship'

export default function App(){
  const [open, setOpen] = useState(false)
  const location = useLocation()
  return (
    <RoleProvider>
    <div className="min-h-screen">
      <Navbar onMenu={() => setOpen(s => !s)} />
      <div className="flex">
        <Sidebar open={open} />
        <main className="flex-1 p-6 notebook">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{opacity:0, x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.4}}>
              <Routes>
                <Route path="/" element={<RoleSelector/>} />
                <Route path="/login/:role" element={<AuthPage />} />
                <Route path="/register/:role" element={<AuthPage />} />
                <Route path="/reset-password" element={<AuthPage />} />
                <Route path="/admin" element={<RequireRole allowed={[ 'admin' ]}><AdminPortal/></RequireRole>} />
                <Route path="/student" element={<RequireRole allowed={[ 'student' ]}><StudentPortal/></RequireRole>} />
                <Route path="/donor" element={<RequireRole allowed={[ 'donor' ]}><DonorPortal/></RequireRole>} />
                <Route path="/landing" element={<Landing/>} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/children" element={<ChildManagement/>} />
                <Route path="/tree" element={<ChildGrowthTree/>} />
                <Route path="/timeline" element={<LifeTimeline/>} />
                <Route path="/dreams" element={<DreamBuilder/>} />
                <Route path="/mentors" element={<MentorMarketplace/>} />
                <Route path="/wall" element={<MessageWall/>} />
                <Route path="/wellness" element={<WellnessRadar/>} />
                <Route path="/museum" element={<AlumniMuseum/>} />
                <Route
                  path="/education"
                  element={
                    <RequireRole allowed={['admin', 'student']} allowedDbRoles={['SUPER_ADMIN', 'STAFF', 'EDUCATOR', 'STUDENT']}>
                      <Education/>
                    </RequireRole>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <RequireRole allowed={['admin', 'student']} allowedDbRoles={['SUPER_ADMIN', 'STAFF', 'HEALTHCARE_STAFF', 'STUDENT']}>
                      <Health/>
                    </RequireRole>
                  }
                />
                <Route path="/resources" element={<Resources/>} />
                <Route path="/donors" element={<Donors/>} />
                <Route path="/scholarships" element={<Scholarships/>} />
                <Route path="/mentorship" element={<Mentorship/>} />
                <Route path="/impact" element={<ImpactMap/>} />
                <Route path="/vault" element={<MemoryVault/>} />
                <Route path="/impact-showcase" element={<ImpactShowcase/>} />
                <Route path="/legacy" element={<LegacyDashboard/>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </RoleProvider>
  )
}