"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, FolderKanban, CheckSquare, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
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
      <Button
        variant={item.isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 h-10",
          collapsed && "justify-center px-2 w-12 h-12"
        )}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Button>
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
        "flex h-full flex-col border-r border-sidebar-border transition-all duration-300 bg-gradient-to-b from-emerald-500/15 via-cyan-500/10 to-sky-500/5",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex-1 flex justify-center">
          <GobiZiLogo collapsed={collapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-9 w-9 hover:bg-sidebar-accent/50"
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

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2 w-12 h-12"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  )
}
