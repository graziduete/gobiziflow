"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  Calculator,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Componente da Logo GobiZi Flow
function GobiZiLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center justify-center w-full">
      <img 
        src="/gobizi-flow-logo.png" 
        alt="GobiZi Flow" 
        className="h-8"
      />
    </div>
  )
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "admin_operacional"]
  },
  {
    name: "Empresas",
    href: "/admin/companies",
    icon: Building2,
    roles: ["admin"] // Only admin can see
  },
  {
    name: "Usuários",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"] // Only admin can see
  },
  {
    name: "Projetos",
    href: "/admin/projects",
    icon: FolderKanban,
    roles: ["admin", "admin_operacional"]
  },
  {
    name: "Estimativas",
    href: "/admin/estimativas",
    icon: Calculator,
    roles: ["admin", "admin_operacional"]
  },
  {
    name: "Sustentação",
    href: "/admin/sustentacao",
    icon: Settings,
    roles: ["admin", "admin_operacional"]
  },
  {
    name: "Configurações",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin", "admin_operacional"]
  },
]

interface SidebarProps {
  className?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  userRole?: string | null
}

export function Sidebar({ className, collapsed, onCollapsedChange, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Filtrar navegação baseada no role do usuário
  const filteredNavigation = navigation.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div
      className={cn("flex h-full flex-col bg-sidebar/50 backdrop-blur-sm border-r border-sidebar-border transition-all duration-300 ease-in-out", className)}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex-1 flex justify-center">
          <GobiZiLogo collapsed={collapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="h-9 w-9 hover:bg-sidebar-accent/50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-2">
            {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 font-medium transition-all duration-300 ease-in-out",
                    collapsed && "justify-center px-2",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
                    !isActive && "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 ease-in-out",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  )
}
