"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, UserCheck } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/responsaveis"
            className="text-blue-600 hover:text-blue-700 text-lg font-medium p-1 rounded-md hover:bg-blue-50 transition-colors"
            title="Voltar para lista"
          >
            ←
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Novo Responsável</h2>
            <p className="text-muted-foreground">Cadastre um novo responsável para tarefas e projetos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Dados do Responsável
          </CardTitle>
          <CardDescription>
            Preencha as informações básicas do responsável. Apenas nome e email são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="exemplo@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={formData.empresa || undefined} onValueChange={(value) => handleInputChange("empresa", value)}>
                <SelectTrigger>
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
              <p className="text-xs text-muted-foreground">
                Se não selecionar uma empresa, as notificações serão enviadas apenas por email
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
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
              
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/responsaveis">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
