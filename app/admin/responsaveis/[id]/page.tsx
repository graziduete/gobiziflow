"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, UserCheck, Mail, Phone, Building, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Responsavel {
  id: string
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  cargo: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VisualizarResponsavelPage({ params }: PageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from("responsaveis")
          .select("*")
          .eq("id", resolvedParams.id)
          .single()

        if (error) throw error
        setResponsavel(data)
      } catch (error) {
        console.error("Erro ao carregar responsável:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do responsável",
          variant: "destructive"
        })
        router.push("/admin/responsaveis")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params, toast, router])

  const handleDelete = async () => {
    if (!responsavel) return
    
    if (!confirm(`Tem certeza que deseja excluir o responsável "${responsavel.nome}"?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("responsaveis")
        .delete()
        .eq("id", responsavel.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Responsável excluído com sucesso"
      })

      router.push("/admin/responsaveis")
    } catch (error) {
      console.error("Erro ao excluir responsável:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir responsável",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!responsavel) {
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
              <h2 className="text-3xl font-bold tracking-tight">Responsável não encontrado</h2>
              <p className="text-muted-foreground">O responsável solicitado não foi encontrado</p>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-3xl font-bold tracking-tight">{responsavel.nome}</h2>
            <p className="text-muted-foreground">Detalhes do responsável</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/responsaveis/${responsavel.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Dados básicos do responsável
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={responsavel.ativo ? "default" : "secondary"}>
                {responsavel.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{responsavel.email}</p>
                </div>
              </div>
              
              {responsavel.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{responsavel.telefone}</p>
                  </div>
                </div>
              )}
              
              {responsavel.empresa && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empresa</p>
                    <p className="text-sm text-muted-foreground">{responsavel.empresa}</p>
                  </div>
                </div>
              )}
              
              {responsavel.cargo && (
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cargo/Função</p>
                    <p className="text-sm text-muted-foreground">{responsavel.cargo}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>
              Dados de criação e atualização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Criado em</p>
                <p className="text-sm text-muted-foreground">{formatDate(responsavel.created_at)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última atualização</p>
                <p className="text-sm text-muted-foreground">{formatDate(responsavel.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Atribuídas (futuro) */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas Atribuídas</CardTitle>
          <CardDescription>
            Lista de tarefas atribuídas a este responsável
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Esta funcionalidade será implementada em breve
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Aqui você poderá ver todas as tarefas atribuídas a este responsável
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
