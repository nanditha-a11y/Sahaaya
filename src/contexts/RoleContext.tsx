import React, { createContext, useContext, useEffect, useState } from 'react'

type Role = 'admin'|'student'|'donor'

const RoleContext = createContext({
  role: 'admin' as Role,
  setRole: (r: Role)=>{}
})

export const RoleProvider: React.FC<{children:React.ReactNode}> = ({children})=>{
  const [role, setRole] = useState<Role>(()=> (localStorage.getItem('sahaaya:role') as Role) || 'admin')

  useEffect(()=>{
    localStorage.setItem('sahaaya:role', role)
  },[role])

  return <RoleContext.Provider value={{role, setRole}}>{children}</RoleContext.Provider>
}

export const useRole = ()=> useContext(RoleContext) as {role:Role, setRole:(r:Role)=>void}
