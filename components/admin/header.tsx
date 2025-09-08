"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Settings, User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface HeaderProps {
  title?: string
  userData?: {
    id: string
    email: string
    full_name?: string
  }
}

export function Header({ title, userData }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(userData || null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Se já temos userData, não precisa buscar
    if (userData) {
      setUser(userData)
      return
    }

    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
        
        console.log("👤 [Header] Loading user data:", {
          userId: user.id,
          userEmail: user.email,
          profileFullName: profile?.full_name,
          profileEmail: profile?.email
        })
        
        setUser({ ...user, ...profile })
      } else {
        console.log("❌ [Header] No user found in auth")
      }
    }

    getUser()
  }, [userData])

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
      setUnreadCount((data || []).filter((n) => !n.read).length)
    }
    fetchNotifications()
  }, [user?.id])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />}
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
                    className={`px-4 py-3 border-b last:border-0 ${!n.read ? 'bg-slate-50' : ''}`}
                    onClick={async () => {
                      if (!n.read) {
                        await supabase.from('notifications').update({ read: true }).eq('id', n.id)
                        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                        setUnreadCount((c) => Math.max(0, c - 1))
                      }
                    }}
                    role="button"
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')}</div>
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

                            <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                {(() => {
                  let initials = "AD"
                  
                  console.log("🔍 [Header] Debug user data:", {
                    user: user,
                    fullName: user?.full_name,
                    email: user?.email,
                    hasUser: !!user
                  })
                  
                  if (user?.full_name) {
                    // Se tem nome completo, usa as iniciais
                    initials = user.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                    console.log("✅ [Header] Using full_name initials:", initials)
                  } else if (user?.email) {
                    // Se não tem nome, usa a primeira letra do email
                    initials = user.email.charAt(0).toUpperCase()
                    console.log("✅ [Header] Using email initial:", initials)
                  } else {
                    console.log("⚠️ [Header] No user data, using fallback:", initials)
                  }
                  
                  return initials
                })()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || "Admin"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
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
