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
import { Bell, Settings, User, LogOut, Moon, Sun } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface HeaderProps {
  title: string
  showSettings?: boolean
}

export function Header({ title, showSettings = false }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
        setUser({ ...user, ...profile })
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-semibold text-gradient">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/50">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-accent/50"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-accent/50">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src="/placeholder.svg" alt={user?.full_name || ""} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                  {user?.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 glass-effect" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2 p-2">
                <p className="text-sm font-medium leading-none">{user?.full_name || "Usuário"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-accent/50 cursor-pointer">
              <User className="mr-3 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            {showSettings && (
              <DropdownMenuItem className="hover:bg-accent/50 cursor-pointer">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-destructive/10 text-destructive cursor-pointer"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
