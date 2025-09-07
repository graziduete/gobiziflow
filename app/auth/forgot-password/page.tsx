"use client"

import type React from "react"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

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

    try {
      const response = await fetch("/api/send-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar email")
      }

      setMessage(data.message || "Verifique seu email para redefinir a senha.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao enviar email de redefinição")
    } finally {
      setIsLoading(false)
    }
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
              <CardTitle className="text-2xl">Esqueceu a Senha?</CardTitle>
              <CardDescription>Digite seu email para receber instruções de redefinição</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {message && <p className="text-sm text-green-600">{message}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar Instruções"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Lembrou da senha?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Voltar ao login
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
