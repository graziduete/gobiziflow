"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Filter, UserCheck, Mail, Phone, Building } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"

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

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAtivo, setFilterAtivo] = useState<"all" | "ativo" | "inativo">("all")
  const { toast } = useToast()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    fetchResponsaveis()
  }, [])

  const fetchResponsaveis = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("responsaveis")
        .select("*")
        .order("nome", { ascending: true })

      if (error) throw error
      setResponsaveis(data || [])
    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar responsáveis",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string, nome: string) => {
    showConfirmation({
      title: "Excluir Responsável",
      description: `Tem certeza que deseja excluir o responsável "${nome}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from("responsaveis")
            .delete()
            .eq("id", id)

          if (error) throw error

          toast({
            title: "Sucesso",
            description: "Responsável excluído com sucesso"
          })

          fetchResponsaveis()
        } catch (error) {
          console.error("Erro ao excluir responsável:", error)
          toast({
            title: "Erro",
            description: "Erro ao excluir responsável",
            variant: "destructive"
          })
        }
      }
    })
  }

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("responsaveis")
        .update({ ativo: !ativo })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Responsável ${!ativo ? "ativado" : "desativado"} com sucesso`
      })

      fetchResponsaveis()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status do responsável",
        variant: "destructive"
      })
    }
  }

  // Filtros
  const filteredResponsaveis = responsaveis.filter(responsavel => {
    const matchesSearch = responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsavel.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (responsavel.empresa && responsavel.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterAtivo === "all" || 
                         (filterAtivo === "ativo" && responsavel.ativo) ||
                         (filterAtivo === "inativo" && !responsavel.ativo)
    
    return matchesSearch && matchesFilter
  })

  const ativosCount = responsaveis.filter(r => r.ativo).length
  const inativosCount = responsaveis.filter(r => !r.ativo).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        {/* Ações skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        {/* Grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Responsáveis</h2>
          <p className="text-muted-foreground">
            Gerencie os responsáveis por tarefas e projetos
            <span className="ml-2 text-blue-600">• {responsaveis.length} responsável{responsaveis.length !== 1 ? 'is' : ''}</span>
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
          <Link href="/admin/responsaveis/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Responsável
          </Link>
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Responsáveis</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responsaveis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ativosCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{inativosCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterAtivo === "all" ? "default" : "outline"}
                onClick={() => setFilterAtivo("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterAtivo === "ativo" ? "default" : "outline"}
                onClick={() => setFilterAtivo("ativo")}
                size="sm"
              >
                Ativos
              </Button>
              <Button
                variant={filterAtivo === "inativo" ? "default" : "outline"}
                onClick={() => setFilterAtivo("inativo")}
                size="sm"
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de responsáveis */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Responsáveis</CardTitle>
          <CardDescription>
            {filteredResponsaveis.length} de {responsaveis.length} responsáveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResponsaveis.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchTerm || filterAtivo !== "all" 
                  ? "Nenhum responsável encontrado com os filtros aplicados"
                  : "Nenhum responsável cadastrado"
                }
              </p>
              {!searchTerm && filterAtivo === "all" && (
                <Button asChild>
                  <Link href="/admin/responsaveis/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Responsável
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredResponsaveis.map((responsavel) => (
                <div key={responsavel.id} className="p-4 border rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col h-full group">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm line-clamp-2">{responsavel.nome}</h3>
                        <Badge variant={responsavel.ativo ? "default" : "secondary"}>
                          {responsavel.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {responsavel.cargo && (
                        <p className="text-xs text-muted-foreground">{responsavel.cargo}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{responsavel.email}</span>
                      </div>
                      {responsavel.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{responsavel.telefone}</span>
                        </div>
                      )}
                      {responsavel.empresa && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{responsavel.empresa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 mt-auto opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                    >
                      <Link href={`/admin/responsaveis/${responsavel.id}/editar`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAtivo(responsavel.id, responsavel.ativo)}
                      className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                    >
                      {responsavel.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(responsavel.id, responsavel.nome)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Confirmação */}
      {ConfirmationDialog}
    </div>
  )
}
