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
import { sendEmail, emailTemplates } from "@/lib/email"

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

        // Send email with credentials
        const companyName = companies.find(c => c.id === selectedCompany)?.name
        const emailSent = await sendEmail({
          to: formData.email,
          ...emailTemplates.newUserCredentials({
            fullName: formData.full_name,
            email: formData.email,
            password: result.user.password,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            companyName: companyName,
          })
        })

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{user ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
        <CardDescription>
          {user ? "Atualize as informações do usuário" : "Preencha os dados para criar um novo usuário"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Label>Tipo de Usuário *</Label>
            <ToggleGroup 
              type="single" 
              value={formData.role} 
              onValueChange={(value) => value && handleChange("role", value)}
              className="justify-start w-full"
            >
              <ToggleGroupItem 
                value="client" 
                aria-label="Cliente"
                className="px-12 py-4 flex-1"
              >
                👤 Cliente
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="admin" 
                aria-label="Administrador"
                className="px-12 py-4 flex-1"
              >
                🔧 Administrador
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="admin_operacional" 
                aria-label="Admin Operacional"
                className="px-12 py-4 flex-1"
              >
                ⚙️ Admin Operacional
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
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Senha Automática</p>
                  <p>Uma senha segura será gerada automaticamente e enviada por e-mail para o usuário.</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : user ? "Atualizar" : "Criar Usuário"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => (onSuccess ? onSuccess() : router.back())}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
