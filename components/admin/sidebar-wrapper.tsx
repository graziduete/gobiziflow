"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"

interface SidebarWrapperProps {
  className?: string
}

export function SidebarWrapper({ className }: SidebarWrapperProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Sidebar 
      className={`${className} transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
      collapsed={collapsed} 
      onCollapsedChange={setCollapsed} 
    />
  )
} 