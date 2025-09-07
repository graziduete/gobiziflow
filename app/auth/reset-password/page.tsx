"use client"

// Evitar pre-render estático desta página para permitir o uso seguro de useSearchParams
export const dynamic = 'force-dynamic'

import type React from "react"
import { Suspense } from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const initializePage = async () => {
      // Verificar se é um reset via email
      const token = searchParams.get('token')
      const email = searchParams.get('email')
      
      if (token === 'reset' && email) {
        setIsResetMode(true)
        setResetEmail(email)
        return
      }

      // Modo normal - usuário logado
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        router.push("/auth/login")
      }
    }

    initializePage()
  }, [router, searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      if (isResetMode && resetEmail) {
        // Modo reset via email - usar API personalizada
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            email: resetEmail, 
            password: password 
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao redefinir senha")
        }

        // Redirecionar para login após sucesso
        router.push("/auth/login?message=Senha redefinida com sucesso")
      } else {
        // Modo normal - usuário logado
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({
          password: password,
        })

        if (error) throw error

        // Update is_first_login to false
        if (user) {
          await supabase.from("profiles").update({ is_first_login: false }).eq("id", user.id)

          // Get user role to redirect appropriately
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

          if (profile?.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao redefinir senha")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user && !isResetMode) {
    return <div>Carregando...</div>
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-sm z-10">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/gobizi-flow-logo.png"
              alt="GobiZi Flow Logo"
              width={200}
              height={80}
              className="object-contain"
            />
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
              <CardDescription>
                {isResetMode && resetEmail 
                  ? `Crie uma nova senha para ${resetEmail}`
                  : "Crie uma nova senha para sua conta"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
