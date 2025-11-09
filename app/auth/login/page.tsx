"use client"

import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validação customizada
    if (!email.trim()) {
      setError("Por favor, digite seu email")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Por favor, digite um email válido")
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Por favor, digite sua senha")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Traduzir mensagens de erro comuns
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Credenciais de login inválidas")
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado")
        } else if (authError.message.includes("Too many requests")) {
          throw new Error("Muitas tentativas. Tente novamente em alguns minutos")
        } else {
          throw new Error("Erro ao fazer login. Verifique suas credenciais")
        }
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_client_admin, first_login_completed")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          console.error("Profile error:", profileError)
          setError("Erro ao carregar perfil do usuário")
          return
        }

        // Se não completou primeiro login, redirecionar para redefinição
        if (!profile.first_login_completed) {
          // Se é client_admin, vai para página específica
          if (profile.is_client_admin) {
            router.push("/admin/first-login")
          } else {
            // Se é usuário normal, vai para redefinição padrão
            router.push("/auth/reset-password?first_login=true")
          }
          return
        }

        // Redirecionamento baseado no role
        if (profile.role === "admin" || profile.role === "admin_operacional" || profile.role === "admin_master") {
          // Se é client_admin (mesmo com role admin), vai para /admin
          if (profile.is_client_admin) {
            window.location.href = "/admin"
          } else {
            window.location.href = "/admin"
          }
        } else {
          window.location.href = "/dashboard"
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Fundo com gradiente otimizado (sem blur pesado) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Círculos estáticos - muito mais leves */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-200/20 rounded-full"></div>
        <div className="absolute -bottom-8 left-1/3 w-64 h-64 bg-blue-300/20 rounded-full"></div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo do Sistema - GobiZi Flow */}
          <div className="flex justify-center mb-6">
            <Image
              src="/gobizi-flow-logo.png"
              alt="GobiZi Flow"
              width={200}
              height={80}
              className="object-contain"
              priority
              style={{ 
                maxWidth: '200px', 
                maxHeight: '80px', 
                width: 'auto', 
                height: 'auto'
              }}
            />
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Entrar no Sistema</CardTitle>
              <CardDescription>Digite suas credenciais para acessar o dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      title="Digite um endereço de email válido"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        title="Digite sua senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
