"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { emailTemplates } from "@/lib/email-templates"

interface UserFormProps {
  user?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  onSuccess?: () => void
}

// Função para gerar senha aleatória
function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    role: user?.role || "client",
    password: "",
    confirmPassword: "",
  })
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("companies").select("id, name").order("name")
      if (data) setCompanies(data)

      // If editing user, fetch their company
      if (user?.id) {
        const { data: userCompanies } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", user.id)
        if (userCompanies && userCompanies.length > 0) {
          setSelectedCompany(userCompanies[0].company_id)
        }
      }
    }

    fetchCompanies()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (formData.role === "client" && !selectedCompany) {
      setError("Usuários clientes devem ser associados a uma empresa")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (user?.id) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            role: formData.role,
          })
          .eq("id", user.id)

        if (updateError) throw updateError

        // Update user company
        await supabase.from("user_companies").delete().eq("user_id", user.id)

        if (selectedCompany) {
          await supabase.from("user_companies").insert({
            user_id: user.id,
            company_id: selectedCompany,
          })
        }

        setSuccess("Usuário atualizado com sucesso!")
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push("/admin/users")
            router.refresh()
          }
        }, 2000)
      } else {
        // Create new user via API route
        console.log("🔧 [UserForm] Creating user via API:", {
          email: formData.email,
          role: formData.role,
          company_id: selectedCompany
        })

        // Call API to create user
        const response = await fetch("/api/users/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            company_id: selectedCompany,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha ao criar usuário")
        }

        const result = await response.json()
        console.log("✅ [UserForm] User created via API:", result.user)

        // Send email with credentials via API
        const companyName = companies.find(c => c.id === selectedCompany)?.name
        const emailTemplate = emailTemplates.newUserCredentials({
          fullName: formData.full_name,
          email: formData.email,
          password: result.user.password,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          companyName: companyName,
        })
        
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            ...emailTemplate
          })
        })
        
        const emailResult = await emailResponse.json()
        const emailSent = emailResult.success

        if (emailSent) {
          setSuccess(`Usuário criado com sucesso! E-mail com credenciais enviado para ${formData.email}`)
        } else {
          setSuccess(`Usuário criado com sucesso! Senha: ${result.user.password} (E-mail não foi enviado)`)
        }

        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push("/admin/users")
            router.refresh()
          }
        }, 3000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full border-slate-200/60 shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-3 xl:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="usuario@email.com"
                required
                disabled={!!user} // Disable email editing for existing users
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold text-slate-700">Tipo de Usuário *</Label>
            <ToggleGroup 
              type="single" 
              value={formData.role} 
              onValueChange={(value) => value && handleChange("role", value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
            >
              <ToggleGroupItem 
                value="client" 
                aria-label="Cliente"
                className="h-auto py-4 px-6 data-[state=on]:bg-gradient-to-r data-[state=on]:from-cyan-500 data-[state=on]:to-blue-600 data-[state=on]:text-white data-[state=on]:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 border-2"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">Cliente</span>
                  <span className="text-xs opacity-80">Acesso ao portal</span>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="admin" 
                aria-label="Administrador"
                className="h-auto py-4 px-6 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-500 data-[state=on]:to-indigo-600 data-[state=on]:text-white data-[state=on]:border-blue-400 hover:bg-blue-50 transition-all duration-200 border-2"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">Administrador</span>
                  <span className="text-xs opacity-80">Acesso total</span>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="admin_operacional" 
                aria-label="Admin Operacional"
                className="h-auto py-4 px-6 data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-pink-600 data-[state=on]:text-white data-[state=on]:border-purple-400 hover:bg-purple-50 transition-all duration-200 border-2"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">Admin Operacional</span>
                  <span className="text-xs opacity-80">Gestão operacional</span>
                </div>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {formData.role === "client" && companies.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="company">Empresa Associada *</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!user && (
            <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-5 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-400/5 to-purple-400/5" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 mb-1">Senha Automática</p>
                  <p className="text-sm text-slate-700">Uma senha segura será gerada automaticamente e enviada por e-mail para o usuário.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-green-800 font-medium flex-1">{success}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-slate-200 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => (onSuccess ? onSuccess() : router.back())}
              disabled={isLoading}
              className="border-2 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-8"
            >
              {isLoading ? "Salvando..." : user ? "Atualizar Usuário" : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
