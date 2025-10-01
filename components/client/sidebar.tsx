"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, FolderKanban, CheckSquare, User, LogOut, ChevronLeft, ChevronRight, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Componente da Logo GobiZi Flow
const GobiZiLogo = memo(function GobiZiLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center justify-center w-full">
      <img 
        src="/gobizi-flow-logo.png" 
        alt="GobiZi Flow" 
        className="h-8"
      />
    </div>
  )
})

// Componente memoizado para itens de navegação
const NavigationItem = memo(function NavigationItem({ 
  item, 
  collapsed 
}: { 
  item: typeof navigation[0] & { isActive: boolean }
  collapsed: boolean 
}) {
  return (
    <Link href={item.href}>
      <div className="relative group">
        {/* Barra lateral azul para item ativo */}
        {item.isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full" />
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11 font-semibold transition-all duration-300 ease-in-out relative",
            collapsed && "justify-center px-2",
            item.isActive && "bg-white/90 backdrop-blur-sm text-blue-700 shadow-md hover:shadow-lg border border-blue-100",
            !item.isActive && "text-slate-700 hover:bg-white/70 hover:backdrop-blur-sm hover:text-slate-900 hover:shadow-sm",
          )}
          title={collapsed ? item.name : undefined}
        >
          <div className={cn(
            "p-1.5 rounded-lg transition-all duration-300",
            item.isActive && "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md",
            !item.isActive && "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
          )}>
            <item.icon className="h-4 w-4 shrink-0" />
          </div>
          {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
        </Button>
      </div>
    </Link>
  )
})

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projetos",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    name: "Minhas Tarefas",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    name: "Sustentação",
    href: "/dashboard/sustentacao",
    icon: Shield,
  },
  {
    name: "Perfil",
    href: "/dashboard/profile",
    icon: User,
  },
]

interface ClientSidebarProps {
  className?: string
}

export function ClientSidebar({ className }: ClientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Importante para evitar hydration mismatch: iniciar com valor estático
  const [collapsed, setCollapsed] = useState(false)

  // Após montar no cliente, ler preferência persistida
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('client-sidebar-collapsed')
      if (savedCollapsed !== null) setCollapsed(JSON.parse(savedCollapsed))
    } catch {}
  }, [])

  // Salvar estado no localStorage quando mudar (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('client-sidebar-collapsed', JSON.stringify(collapsed))
    }, 100) // Debounce de 100ms

    return () => clearTimeout(timeoutId)
  }, [collapsed])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }, [router])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const navigationItems = useMemo(() => navigation.map((item) => {
    const isActive = pathname === item.href
    return {
      ...item,
      isActive
    }
  }), [pathname])

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-gradient-to-b from-cyan-50/60 via-blue-50/40 to-indigo-50/50 border-r border-slate-200/60 transition-all duration-300 ease-in-out shadow-lg relative",
        collapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Padrão decorativo sutil de fundo */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(6 182 212) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      
      {/* Header da sidebar com logo */}
      <div className="relative flex h-16 items-center justify-between px-4 border-b border-slate-200 bg-gradient-to-r from-cyan-100/40 to-blue-100/40">
        {/* Círculo decorativo no header */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-xl" />
        
        <div className="flex-1 flex justify-center relative z-10">
          <GobiZiLogo collapsed={collapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-9 w-9 hover:bg-cyan-100 hover:text-cyan-600 transition-all relative z-10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem key={item.name} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-200 p-3 bg-gradient-to-r from-red-50/30 to-orange-50/30 relative z-10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 h-11 font-semibold text-slate-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-600 transition-all duration-300 ease-in-out group",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Sair" : undefined}
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
