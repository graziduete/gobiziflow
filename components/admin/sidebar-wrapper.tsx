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
    }
    getUserRole()
  }, [])

  return (
    <Sidebar 
      className={`${className} transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-56'}`}
      collapsed={collapsed} 
      onCollapsedChange={setCollapsed}
      userRole={userRole}
    />
  )
}