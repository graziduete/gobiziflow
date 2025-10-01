"use client"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { translateNotificationMessage, formatDateBrazil } from "@/lib/utils/status-translation"

interface ClientHeaderProps {
  title?: string
}

export function ClientHeader({ title }: ClientHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
          setUser({ ...user, ...profile })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read).length)
    }
    fetchNotifications()
  }, [user?.id])

  // 🔥 Realtime: Atualiza notificações em tempo real
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('client-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 [Client Realtime] Nova notificação:', payload)

          if (payload.eventType === 'INSERT') {
            // Nova notificação
            setNotifications((prev) => [payload.new as any, ...prev].slice(0, 20))
            setUnreadCount((prev) => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            // Notificação atualizada (ex: marcada como lida)
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as any) : n))
            )
            setUnreadCount((prev) => {
              const wasUnread = !payload.old?.read
              const isUnread = !payload.new?.read
              if (wasUnread && !isUnread) return Math.max(0, prev - 1)
              if (!wasUnread && isUnread) return prev + 1
              return prev
            })
          } else if (payload.eventType === 'DELETE') {
            // Notificação deletada
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
            if (!payload.old?.read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    // Cleanup ao desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const userInitials = useMemo(() => {
    if (!user) return "CL"
    
    if (user.full_name) {
      return user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    
    return "CL"
  }, [user])

  const displayName = useMemo(() => {
    if (isLoading) return "Carregando..."
    if (user?.full_name) return user.full_name
    if (user?.email) return user.email.split('@')[0]
    return "Usuário"
  }, [user, isLoading])

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/60 bg-gradient-to-r from-white via-cyan-50/20 to-blue-50/30 px-6 shadow-sm backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Portal do Cliente</h1>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-cyan-100 hover:text-cyan-600 transition-all">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[380px]" align="end" forceMount>
            <DropdownMenuLabel className="font-medium">Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[320px] overflow-y-auto">
              {(notifications || []).length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Sem notificações</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-slate-100 ${
                      !n.read ? 'bg-blue-50 border-l-4 border-l-blue-500 font-medium' : ''
                    }`}
                    onClick={async () => {
                      if (!n.read) {
                        await supabase.from('notifications').update({ read: true }).eq('id', n.id)
                        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                        setUnreadCount((c) => Math.max(0, c - 1))
                      }
                    }}
                    role="button"
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{translateNotificationMessage(n.message)}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{formatDateBrazil(n.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {(notifications || []).length > 0 && (
              <div className="p-2 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!user?.id) return
                    await supabase
                      .from('notifications')
                      .update({ read: true })
                      .eq('user_id', user.id)
                      .eq('read', false)
                    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
                    setUnreadCount(0)
                  }}
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-right">
          <p className="text-sm font-medium">{displayName}</p>
          {user?.full_name && user?.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:scale-110 transition-transform">
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-cyan-100">
                {isLoading ? "..." : userInitials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || "Cliente"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
