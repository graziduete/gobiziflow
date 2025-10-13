"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { UserCog, Building2, Users, AlertCircle, CheckCircle } from "lucide-react"

interface Company {
  id: string
  type: "PJ" | "PF"
  corporate_name?: string
  full_name?: string
  email: string
  licenses_quantity: number
  status: "active" | "inactive" | "trial"
}

interface Admin {
  id: string
  company_id: string
  full_name: string
  email: string
  status: "active" | "inactive"
  created_at: string
}

interface ClientAdminFormProps {
  admin?: Admin
  onSuccess?: () => void
}

export function ClientAdminForm({ admin, onSuccess }: ClientAdminFormProps) {
  const [formData, setFormData] = useState({
    company_id: admin?.company_id || "",
    full_name: admin?.full_name || "",
    email: admin?.email || "",
    status: admin?.status || "active" as "active" | "inactive"
  })

  const [companies, setCompanies] = useState<Company[]>([])
  const [adminCounts, setAdminCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Carregar empresas e contadores de admins
  useEffect(() => {
    fetchCompaniesAndCounts()
  }, [])

  const fetchCompaniesAndCounts = async () => {
    try {
      setIsLoadingData(true)
      
      const response = await fetch("/api/client-companies")
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro ao carregar empresas")
      }

      setCompanies(result.companies || [])
      setAdminCounts(result.adminCounts || {})
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setError("Falha ao carregar dados das empresas")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validar licenças antes de criar/editar
      if (!admin?.id) { // Só valida na criação
        const selectedCompany = companies.find(c => c.id === formData.company_id)
        if (selectedCompany) {
          const currentAdmins = adminCounts[selectedCompany.id] || 0
          if (currentAdmins >= selectedCompany.licenses_quantity) {
            throw new Error(`Limite de licenças atingido para ${selectedCompany.type === "PJ" ? selectedCompany.corporate_name : selectedCompany.full_name}. Licenças contratadas: ${selectedCompany.licenses_quantity}`)
          }
        }
      }

      if (admin?.id) {
        // Atualizar administrador existente (usar serviço direto para edição simples)
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from("client_admins")
          .update({
            company_id: formData.company_id,
            full_name: formData.full_name,
            email: formData.email,
            status: formData.status
          })
          .eq("id", admin.id)

        if (updateError) throw updateError

        setSuccess("Administrador atualizado com sucesso!")
      } else {
        // Criar novo administrador usando API route
        const response = await fetch("/api/client-admins/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_id: formData.company_id,
            full_name: formData.full_name,
            email: formData.email,
            status: formData.status
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro ao criar administrador")
        }

        setSuccess("Administrador criado com sucesso! E-mail de boas-vindas enviado.")
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/admin/client-management/admins")
          router.refresh()
        }
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getSelectedCompany = () => {
    return companies.find(c => c.id === formData.company_id)
  }

  const getLicenseInfo = () => {
    const company = getSelectedCompany()
    if (!company) return null

    const used = adminCounts[company.id] || 0
    const available = company.licenses_quantity - used

    return {
      company,
      used,
      available,
      total: company.licenses_quantity
    }
  }

  const licenseInfo = getLicenseInfo()

  if (isLoadingData) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando dados das empresas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção da Empresa */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <Label className="text-base font-semibold text-slate-700">Empresa Associada *</Label>
                </div>
                
                <Select value={formData.company_id} onValueChange={(value) => handleChange("company_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.type === "PJ" ? company.corporate_name : company.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Informações de Licenças */}
                {licenseInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Licenças da Empresa</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600 font-medium">Total Contratadas</p>
                        <p className="text-lg font-bold text-blue-800">{licenseInfo.total}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Em Uso</p>
                        <p className="text-lg font-bold text-blue-800">{licenseInfo.used}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 font-medium">Disponíveis</p>
                        <p className={`text-lg font-bold ${licenseInfo.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {licenseInfo.available}
                        </p>
                      </div>
                    </div>
                    {licenseInfo.available === 0 && (
                      <div className="flex items-center gap-2 mt-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Limite de licenças atingido para esta empresa</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Administrador */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-purple-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md">
                    <UserCog className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">Dados do Administrador</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="Nome completo do administrador"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email">E-mail de Acesso *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensagens de Erro e Sucesso */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-sm text-green-800 font-medium flex-1">{success}</p>
              </div>
            </div>
          )}

          {/* Botões de Ação - Card */}
          <Card className="bg-gradient-to-r from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (onSuccess) {
                      onSuccess()
                    } else if (admin) {
                      router.push('/admin/client-management/admins')
                    } else {
                      router.back()
                    }
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || (licenseInfo && licenseInfo.available === 0 && !admin?.id)}
                  className="px-8 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  {isLoading ? "Salvando..." : admin ? "Atualizar Administrador" : "Criar Administrador"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </CardContent>
    </Card>
  )
}
