"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, UserCheck, UserPlus, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Company {
  id: string
  name: string
}

export default function NovoResponsavelPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: ""
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error("Erro ao buscar empresas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Validação de email duplicado temporariamente comentada para testes
    // const { data: existingResponsavel } = await supabase
    //   .from("responsaveis")
    //   .select("id")
    //   .eq("email", formData.email.trim())
    //   .single()

    // if (existingResponsavel) {
    //   toast({
    //     title: "Erro",
    //     description: "Já existe um responsável com este email",
    //     variant: "destructive"
    //   })
    //   return
    // }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from("responsaveis")
        .insert({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          empresa: formData.empresa && formData.empresa.trim() ? formData.empresa.trim() : null,
          ativo: true
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Responsável cadastrado com sucesso"
      })

      router.push("/admin/responsaveis")
    } catch (error: any) {
      console.error("Erro ao cadastrar responsável:", error)
      
      // Validação de email duplicado temporariamente comentada para testes
      // if (error.code === "23505") {
      //   toast({
      //     title: "Erro",
      //     description: "Já existe um responsável com este email",
      //     variant: "destructive"
      //   })
      // } else {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar responsável",
        variant: "destructive"
      })
      // }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header modernizado */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
        <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/responsaveis"
              className="absolute top-4 left-4 text-blue-600 hover:text-blue-700 text-lg font-medium p-1 rounded-md hover:bg-blue-50 transition-colors"
              title="Voltar para lista"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4 ml-12">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Novo Responsável
                </h2>
                <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Cadastre um novo responsável para tarefas e projetos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <Card className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-700">Informações Básicas</CardTitle>
                </div>
                <CardDescription className="text-sm text-slate-600">
                  Preencha as informações básicas do responsável. Apenas nome e email são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-base font-semibold text-slate-700">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome completo"
                      required
                      className="h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold text-slate-700">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="exemplo@empresa.com"
                      required
                      className="h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Empresa */}
            <Card className="bg-gradient-to-br from-slate-50/80 to-indigo-50/50 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-700">Empresa</CardTitle>
                </div>
                <CardDescription className="text-sm text-slate-600">
                  Associação opcional com uma empresa para notificações específicas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-base font-semibold text-slate-700">Empresa</Label>
                  <Select value={formData.empresa || undefined} onValueChange={(value) => handleInputChange("empresa", value)}>
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200">
                      <SelectValue placeholder="Selecione uma empresa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.name}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Se não selecionar uma empresa, as notificações serão enviadas apenas por email
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <Card className="bg-gradient-to-br from-slate-50/80 to-slate-100/50 border border-slate-200/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="px-6 py-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                  >
                    <Link href="/admin/responsaveis">Cancelar</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Responsável
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
