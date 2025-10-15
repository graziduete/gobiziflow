"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { createClient } from "@/lib/supabase/client"

interface SidebarWrapperProps {
  className?: string
}

export function SidebarWrapper({ className }: SidebarWrapperProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(profile?.role || null)
      }
      setIsLoading(false)
    }
    getUserRole()
  }, [])

  // Mostrar loading até o perfil ser carregado
  if (isLoading) {
    return (
      <div className={`${className} transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} flex h-full flex-col bg-gradient-to-b from-slate-50 via-blue-50/20 to-indigo-50/30 border-r border-slate-200/60 shadow-lg relative`}>
        <div className="flex h-16 items-center justify-center border-b border-slate-200 bg-gradient-to-r from-cyan-100/40 to-blue-100/40">
          <div className="animate-pulse bg-slate-200 h-8 w-24 rounded"></div>
        </div>
        <div className="flex-1 px-3 py-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 h-11 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Sidebar 
      className={`${className} transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
      collapsed={collapsed} 
      onCollapsedChange={setCollapsed}
      userRole={userRole}
    />
  )
}