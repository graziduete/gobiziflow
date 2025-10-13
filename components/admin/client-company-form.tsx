"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Building2, User, MapPin, CreditCard, Calculator, Search, CheckCircle, AlertCircle } from "lucide-react"
import { useCep } from "@/hooks/use-cep"

interface ClientCompanyFormProps {
  company?: {
    id: string
    type: "PJ" | "PF"
    corporate_name?: string
    full_name?: string
    cnpj?: string
    cpf?: string
    email: string
    cep: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    plan_type: "teste_7_dias" | "plano_pro"
    licenses_quantity: number
    price_per_license: number
    total_value: number
    card_number: string
    card_name: string
    card_expiry: string
    card_cvv: string
    status: "active" | "inactive" | "trial"
  }
  onSuccess?: () => void
}

const PLAN_OPTIONS = [
  { value: "teste_7_dias", label: "Teste 7 dias" },
  { value: "plano_pro", label: "Plano Pro" }
]

const LICENSE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const PRICE_OPTIONS = [
  9.90, 10.90, 19.90, 29.90, 39.90, 49.90, 59.90, 69.90, 79.90, 89.90,
  99.90, 109.90, 209.90, 309.90, 409.90, 509.90
]

export function ClientCompanyForm({ company, onSuccess }: ClientCompanyFormProps) {
  const { cepData, isLoading: cepLoading, error: cepError, fetchCep, clearCep } = useCep()
  
  const [formData, setFormData] = useState({
    type: company?.type || "PJ" as "PJ" | "PF",
    corporate_name: company?.corporate_name || "",
    full_name: company?.full_name || "",
    cnpj: company?.cnpj || "",
    cpf: company?.cpf || "",
    email: company?.email || "",
    cep: company?.cep || "",
    street: company?.street || "",
    number: company?.number || "",
    neighborhood: company?.neighborhood || "",
    city: company?.city || "",
    state: company?.state || "",
    plan_type: company?.plan_type || "plano_pro" as "teste_7_dias" | "plano_pro",
    licenses_quantity: company?.licenses_quantity || 1,
    price_per_license: company?.price_per_license || 19.90,
    total_value: company?.total_value || 0,
    card_number: company?.card_number || "",
    card_name: company?.card_name || "",
    card_expiry: company?.card_expiry || "",
    card_cvv: company?.card_cvv || "",
    status: company?.status || "active" as "active" | "inactive" | "trial"
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Calcular valor total automaticamente
  useEffect(() => {
    const total = formData.licenses_quantity * formData.price_per_license
    setFormData(prev => ({ ...prev, total_value: total }))
  }, [formData.licenses_quantity, formData.price_per_license])

  // Preencher endereço automaticamente quando CEP for encontrado
  useEffect(() => {
    if (cepData) {
      setFormData(prev => ({
        ...prev,
        street: cepData.logradouro,
        neighborhood: cepData.bairro,
        city: cepData.localidade,
        state: cepData.uf
      }))
    }
  }, [cepData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      if (company?.id) {
        // Atualizar empresa existente
        const { error: updateError } = await supabase
          .from("client_companies")
          .update(formData)
          .eq("id", company.id)

        if (updateError) throw updateError

        setSuccess("Empresa atualizada com sucesso!")
      } else {
        // Criar nova empresa
        const { error: createError } = await supabase
          .from("client_companies")
          .insert([formData])

        if (createError) throw createError

        setSuccess("Empresa criada com sucesso!")
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/admin/client-management/companies")
          router.refresh()
        }
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCepChange = (cep: string) => {
    handleChange("cep", cep)
    
    // Limpar dados anteriores se CEP mudou
    if (cepData) {
      clearCep()
    }
  }

  const handleSearchCep = async () => {
    if (formData.cep.length >= 8) {
      await fetchCep(formData.cep)
    }
  }

  const formatCep = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara: 00000-000
    if (numbers.length <= 5) {
      return numbers
    } else {
      return numbers.slice(0, 5) + '-' + numbers.slice(5, 8)
    }
  }

  const formatCnpj = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara: 00.000.000/0000-00
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return numbers.slice(0, 2) + '.' + numbers.slice(2)
    } else if (numbers.length <= 8) {
      return numbers.slice(0, 2) + '.' + numbers.slice(2, 5) + '.' + numbers.slice(5)
    } else if (numbers.length <= 12) {
      return numbers.slice(0, 2) + '.' + numbers.slice(2, 5) + '.' + numbers.slice(5, 8) + '/' + numbers.slice(8)
    } else {
      return numbers.slice(0, 2) + '.' + numbers.slice(2, 5) + '.' + numbers.slice(5, 8) + '/' + numbers.slice(8, 12) + '-' + numbers.slice(12, 14)
    }
  }

  const formatCpf = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara: 000.000.000-00
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 6) {
      return numbers.slice(0, 3) + '.' + numbers.slice(3)
    } else if (numbers.length <= 9) {
      return numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6)
    } else {
      return numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6, 9) + '-' + numbers.slice(9, 11)
    }
  }

  const formatCardExpiry = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara: MM/AA
    if (numbers.length <= 2) {
      return numbers
    } else {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4)
    }
  }

  const formatCardNumber = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara: 0000 0000 0000 0000
    if (numbers.length <= 4) {
      return numbers
    } else if (numbers.length <= 8) {
      return numbers.slice(0, 4) + ' ' + numbers.slice(4)
    } else if (numbers.length <= 12) {
      return numbers.slice(0, 4) + ' ' + numbers.slice(4, 8) + ' ' + numbers.slice(8)
    } else {
      return numbers.slice(0, 4) + ' ' + numbers.slice(4, 8) + ' ' + numbers.slice(8, 12) + ' ' + numbers.slice(12, 16)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPriceOptions = () => {
    return PRICE_OPTIONS.map(price => ({
      value: price.toString(),
      label: formatCurrency(price)
    }))
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cliente */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <Label className="text-base font-semibold text-slate-700">Tipo de Cliente *</Label>
                </div>
                <ToggleGroup 
                  type="single" 
                  value={formData.type} 
                  onValueChange={(value) => value && handleChange("type", value)}
                  className="grid grid-cols-2 gap-4 w-full"
                >
                  <ToggleGroupItem 
                    value="PJ" 
                    aria-label="Pessoa Jurídica"
                    className="h-auto py-6 px-8 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-500 data-[state=on]:to-indigo-600 data-[state=on]:text-white data-[state=on]:border-blue-400 hover:bg-blue-50 transition-all duration-200 border-2"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="h-6 w-6" />
                      <span className="text-lg font-bold">Pessoa Jurídica</span>
                      <span className="text-xs opacity-80">Empresa/CNPJ</span>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="PF" 
                    aria-label="Pessoa Física"
                    className="h-auto py-6 px-8 data-[state=on]:bg-gradient-to-r data-[state=on]:from-green-500 data-[state=on]:to-emerald-600 data-[state=on]:text-white data-[state=on]:border-green-400 hover:bg-green-50 transition-all duration-200 border-2"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <User className="h-6 w-6" />
                      <span className="text-lg font-bold">Pessoa Física</span>
                      <span className="text-xs opacity-80">Individual/CPF</span>
                    </div>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardContent>
          </Card>

          {/* Dados Básicos */}
          <Card className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Dados Básicos</h3>
              </div>
              <div className="space-y-6">

            {formData.type === "PJ" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="corporate_name">Razão Social *</Label>
                  <Input
                    id="corporate_name"
                    value={formData.corporate_name}
                    onChange={(e) => handleChange("corporate_name", e.target.value)}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formatCnpj(formData.cnpj)}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formatCpf(formData.cpf)}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
              </div>
            )}

                <div className="space-y-3">
                  <Label htmlFor="email">E-mail de Contato *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contato@empresa.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Endereço</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="cep">CEP *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formatCep(formData.cep)}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleSearchCep}
                    disabled={cepLoading || formData.cep.length < 8}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    {cepLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    ) : cepData ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {cepError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {cepError}
                  </div>
                )}
                {cepData && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Endereço encontrado!
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="street">Logradouro *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="Centro"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="São Paulo"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Plano */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Dados do Plano</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="plan_type">Tipo de Plano *</Label>
                <Select value={formData.plan_type} onValueChange={(value) => handleChange("plan_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="licenses_quantity">Quantidade de Licenças *</Label>
                <Select 
                  value={formData.licenses_quantity.toString()} 
                  onValueChange={(value) => handleChange("licenses_quantity", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_OPTIONS.map((quantity) => (
                      <SelectItem key={quantity} value={quantity.toString()}>
                        {quantity} licença{quantity > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="price_per_license">Preço por Licença *</Label>
                <Select 
                  value={formData.price_per_license.toString()} 
                  onValueChange={(value) => handleChange("price_per_license", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatPriceOptions().map((price) => (
                      <SelectItem key={price.value} value={price.value}>
                        {price.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="total_value">Valor Total Contratado</Label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(formData.total_value)}
                  </p>
                  <p className="text-xs text-green-600">
                    {formData.licenses_quantity} licença{formData.licenses_quantity > 1 ? 's' : ''} × {formatCurrency(formData.price_per_license)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Cartão */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Dados do Cartão</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="card_number">Número do Cartão *</Label>
                <Input
                  id="card_number"
                  value={formatCardNumber(formData.card_number)}
                  onChange={(e) => handleChange("card_number", e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="card_name">Nome no Cartão *</Label>
                <Input
                  id="card_name"
                  value={formData.card_name}
                  onChange={(e) => handleChange("card_name", e.target.value)}
                  placeholder="Nome como no cartão"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="card_expiry">Data de Validade *</Label>
                <Input
                  id="card_expiry"
                  value={formatCardExpiry(formData.card_expiry)}
                  onChange={(e) => handleChange("card_expiry", e.target.value)}
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="card_cvv">CVV *</Label>
                <Input
                  id="card_cvv"
                  value={formData.card_cvv}
                  onChange={(e) => handleChange("card_cvv", e.target.value)}
                  placeholder="000"
                  maxLength={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensagens de Erro e Sucesso */}
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
                    } else if (company) {
                      // Se está editando, vai para a listagem de empresas
                      router.push('/admin/client-management/companies')
                    } else {
                      // Se está criando, volta para a página anterior
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
                  disabled={isLoading}
                  className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  {isLoading ? "Salvando..." : company ? "Atualizar Empresa" : "Criar Empresa"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </CardContent>
    </Card>
  )
}
