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
  Shield,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  DollarSign,
  UserCog,
  BarChart3,
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
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Empresas",
    href: "/admin/companies",
    icon: Building2,
    roles: ["admin", "admin_master"] // Only admin and admin_master can see
  },
  {
    name: "Usuários",
    href: "/admin/users",
    icon: Users,
    roles: ["admin", "admin_master"] // Only admin and admin_master can see
  },
  {
    name: "Projetos",
    href: "/admin/projects",
    icon: FolderKanban,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Estimativas",
    href: "/admin/estimativas",
    icon: Calculator,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Responsáveis",
    href: "/admin/responsaveis",
    icon: UserCheck,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Logs de Notificações",
    href: "/admin/notifications/logs",
    icon: Bell,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Sustentação",
    href: "/admin/sustentacao",
    icon: Shield,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  {
    name: "Financeiro",
    href: "/admin/financeiro",
    icon: DollarSign,
    roles: ["admin", "admin_master"] // Only admin and admin_master can see
  },
  {
    name: "Configurações",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin", "admin_operacional", "admin_master"]
  },
  // NOVO: Menu específico para admin_master
  {
    name: "Admin Clientes",
    href: "/admin/client-management",
    icon: UserCog,
    roles: ["admin_master"], // Apenas admin_master vê este menu
    badge: "Admin"
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
      className={cn("flex h-full flex-col bg-gradient-to-b from-slate-50 via-blue-50/20 to-indigo-50/30 border-r border-slate-200/60 transition-all duration-300 ease-in-out shadow-lg relative", className)}
    >
      {/* Padrão decorativo sutil de fundo */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      
      {/* Header da sidebar com logo */}
      <div className="relative flex h-16 items-center justify-between px-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
        {/* Círculo decorativo no header */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-xl" />
        
        <div className="flex-1 flex justify-center relative z-10">
          <GobiZiLogo collapsed={collapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="h-9 w-9 hover:bg-blue-100 hover:text-blue-600 transition-all relative z-10"
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
                <div className="relative group">
                  {/* Barra lateral azul para item ativo */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full" />
                  )}
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-11 font-semibold transition-all duration-300 ease-in-out relative",
                      collapsed && "justify-center px-2",
                      isActive && "bg-white/90 backdrop-blur-sm text-blue-700 shadow-md hover:shadow-lg border border-blue-100",
                      !isActive && "text-slate-700 hover:bg-white/70 hover:backdrop-blur-sm hover:text-slate-900 hover:shadow-sm",
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-300",
                      isActive && "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md",
                      !isActive && "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}>
                      <item.icon className="h-4 w-4 shrink-0" />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-left">{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Button>
                </div>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-200 p-3 bg-gradient-to-r from-red-50/30 to-orange-50/30">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 h-11 font-semibold text-slate-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-600 transition-all duration-300 ease-in-out group",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-orange-500 group-hover:text-white transition-all duration-300">
            <LogOut className="h-4 w-4 shrink-0" />
          </div>
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  )
}
