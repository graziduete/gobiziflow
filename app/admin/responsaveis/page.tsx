"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Filter, UserCheck, Mail, Phone, Building, Grid3X3, List } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const { toast } = useToast()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  useEffect(() => {
    fetchResponsaveis()
  }, [])

  const fetchResponsaveis = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Obter dados do usuário logado para aplicar filtros
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from("responsaveis")
        .select("*")

      // Aplicar filtros baseados no role
      if (profile?.is_client_admin) {
        // Client Admin: apenas responsáveis do seu tenant
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        } else {
          // Se não encontrar client_admin, não mostrar nenhum responsável
          query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000000') // UUID inválido
        }
      } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        // Admin Normal/Operacional: apenas responsáveis sem tenant_id
        query = query.is('tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      const { data, error } = await query.order("nome", { ascending: true })

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

  // Componente de visualização em lista
  const ListView = () => (
    <div className="space-y-2">
      {filteredResponsaveis.map((responsavel) => (
        <div key={responsavel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50/50 hover:border-slate-200 transition-all duration-200 group">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium text-slate-900 truncate">{responsavel.nome}</h3>
                <Badge className={responsavel.ativo 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-sm" 
                  : "bg-gradient-to-r from-gray-500 to-slate-600 text-white font-semibold shadow-sm"
                }>
                  {responsavel.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{responsavel.email}</span>
                </div>
                {responsavel.telefone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{responsavel.telefone}</span>
                  </div>
                )}
                {responsavel.empresa && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{responsavel.empresa}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
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
              className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
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
  )

  // Componente de visualização em cards
  const CardView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredResponsaveis.map((responsavel) => (
        <div key={responsavel.id} className="p-4 border rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col h-full group">
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm line-clamp-2">{responsavel.nome}</h3>
                <Badge className={responsavel.ativo 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-sm" 
                  : "bg-gradient-to-r from-gray-500 to-slate-600 text-white font-semibold shadow-sm"
                }>
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
  )

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
            <span className="ml-2 text-blue-600">• {responsaveis.length} responsáve{responsaveis.length !== 1 ? 'is' : 'l'}</span>
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
                className={filterAtivo === "all" ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md" : ""}
              >
                Todos
              </Button>
              <Button
                variant={filterAtivo === "ativo" ? "default" : "outline"}
                onClick={() => setFilterAtivo("ativo")}
                size="sm"
                className={filterAtivo === "ativo" ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md" : ""}
              >
                Ativos
              </Button>
              <Button
                variant={filterAtivo === "inativo" ? "default" : "outline"}
                onClick={() => setFilterAtivo("inativo")}
                size="sm"
                className={filterAtivo === "inativo" ? "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white shadow-md" : ""}
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle de Visualização */}
      <div className="flex justify-end">
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className={`h-8 px-3 ${viewMode === "card" 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm" 
              : "text-slate-600 hover:text-slate-900 hover:bg-transparent"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`h-8 px-3 ${viewMode === "list" 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm" 
              : "text-slate-600 hover:text-slate-900 hover:bg-transparent"
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de responsáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewMode === "card" ? <Grid3X3 className="h-5 w-5" /> : <List className="h-5 w-5" />}
            {viewMode === "card" ? "Cards de Responsáveis" : "Lista de Responsáveis"}
          </CardTitle>
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
            viewMode === "card" ? <CardView /> : <ListView />
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Confirmação */}
      {confirmationData && (
        <ConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          title={confirmationData.title}
          description={confirmationData.description}
          onConfirm={() => {
            confirmationData.onConfirm()
            setShowConfirmation(false)
            setConfirmationData(null)
          }}
        />
      )}
    </div>
  )
}
