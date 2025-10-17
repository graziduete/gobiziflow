"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Kanban, Search, Building2, Calendar, Users, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  start_date?: string
  end_date?: string
  budget?: number
  companies?: {
    name: string
  }
  technical_responsible?: string
  key_user?: string
  project_type?: string
}

export default function FlowTasksPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, statusFilter, typeFilter])

  const fetchProjects = async () => {
    try {
      const supabase = createClient()
      
      // Obter dados do usuário logado
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
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          priority,
          start_date,
          end_date,
          budget,
          technical_responsible,
          key_user,
          project_type,
          companies!inner(
            name
          )
        `)
        .order("created_at", { ascending: false })

      // Aplicar filtros baseados no perfil do usuário
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        }
      } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter)
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(project => project.project_type === typeFilter)
    }

    setFilteredProjects(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "planning":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "in_progress":
        return "Em Andamento"
      case "planning":
        return "Planejamento"
      case "delayed":
        return "Atrasado"
      case "on_hold":
        return "Pausado"
      default:
        return "Planejamento"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente"
      case "high":
        return "Alta"
      case "medium":
        return "Média"
      default:
        return "Baixa"
    }
  }

  const getProjectTypeText = (type?: string) => {
    const types: { [key: string]: string } = {
      automation: "Automação",
      data_analytics: "Data & Analytics",
      digital_development: "Desenvolvimento Digital",
      design: "Design",
      consulting: "Consultoria",
      project_management: "Gestão de Projetos",
      system_integration: "Integração de Sistemas",
      infrastructure: "Infraestrutura",
      support: "Suporte",
      training: "Treinamento"
    }
    return type ? types[type] || type : "Não definido"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente moderno */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-lg">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        
        {/* Círculo decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl" />
        
        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Kanban className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    FlowTasks
                  </h1>
                  <p className="text-slate-600 mt-1 text-lg">
                    Gerencie suas tarefas com visualização Kanban moderna
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{filteredProjects.length}</div>
                <div className="text-sm text-slate-600">projetos ativos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros modernos */}
      <Card className="border-0 bg-gradient-to-r from-white to-slate-50/50 shadow-lg backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="on_hold">Pausado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-slate-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="automation">Automação</SelectItem>
                <SelectItem value="digital_development">Desenvolvimento Digital</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="consulting">Consultoria</SelectItem>
                <SelectItem value="project_management">Gestão de Projetos</SelectItem>
                <SelectItem value="system_integration">Integração de Sistemas</SelectItem>
                <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="training">Treinamento</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-center">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-blue-700">
                  {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 border-0 bg-gradient-to-br from-white via-slate-50/30 to-white overflow-hidden relative">
            {/* Barra lateral colorida baseada no status */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
              style={{
                background: project.status === 'completed' ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' :
                           project.status === 'in_progress' ? 'linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)' :
                           project.status === 'delayed' ? 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)' :
                           project.status === 'planning' ? 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)' :
                           'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)'
              }}
            />
            
            {/* Padrão decorativo sutil */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-1 font-medium">
                    {project.companies?.name}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Badge className={`text-xs px-3 py-1.5 font-semibold shadow-sm ${getStatusColor(project.status)} border-0`}>
                    {getStatusText(project.status)}
                  </Badge>
                  <Badge className={`text-xs px-3 py-1.5 font-semibold shadow-sm ${getPriorityColor(project.priority)} border-0`}>
                    {getPriorityText(project.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
              {project.description && (
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <span className="text-slate-600 font-medium">{getProjectTypeText(project.project_type)}</span>
                </div>

                {project.start_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="text-slate-600">Início: {new Date(project.start_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}

                {project.end_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="text-slate-600">Fim: {new Date(project.end_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}

                {project.technical_responsible && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="text-slate-600">{project.technical_responsible}</span>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <span className="text-green-600 font-bold">R$</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {Number(project.budget).toLocaleString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/60">
                <Link href={`/admin/flowtasks/${project.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] font-semibold">
                    Abrir Board Kanban
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <Card className="border-0 bg-gradient-to-br from-slate-50 to-white shadow-lg">
          <CardContent className="text-center py-16">
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full w-24 h-24 mx-auto mb-6 shadow-lg">
                <Kanban className="h-12 w-12 text-blue-500 mx-auto" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Nenhum projeto encontrado
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Tente ajustar os filtros para encontrar projetos que correspondam aos seus critérios."
                : "Não há projetos disponíveis no momento. Verifique suas permissões ou contate o administrador."}
            </p>
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
              <Button 
                variant="outline" 
                className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
