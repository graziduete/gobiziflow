"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


import { Calendar, Clock, TrendingUpIcon as TrendingRight, Maximize2, Search, Building2, Tag, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GanttViewProps {
  projects: any[] // já filtrados pelo container
  allProjects?: any[] // lista completa para regras especiais na expandida
  companies?: any[]
  selectedMonth?: number | null
  selectedYear?: number
  externalFilters?: ExpandedFilters // filtros externos do dashboard
}

interface ExpandedFilters {
  search: string
  company: string
  type: string
  status: string
}

export function GanttView({ projects, allProjects, companies = [], selectedMonth, selectedYear, externalFilters }: GanttViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState<ExpandedFilters>({
    search: "",
    company: "all",
    type: "all",
    status: "all"
  })

  // Sincronizar filtros externos com filtros internos
  useEffect(() => {
    if (externalFilters) {
      console.log('🔄 [GanttView] Sincronizando filtros externos:', externalFilters)
      setExpandedFilters(externalFilters)
    } else {
      console.log('⚠️ [GanttView] Nenhum filtro externo recebido')
    }
  }, [externalFilters])

  // Debug: verificar dados dos projetos
  console.log("🔍 [GanttView] Projects data:", projects)
  projects.forEach((project, index) => {
    console.log(`🔍 [GanttView] Project ${index}:`, {
      name: project.name,
      start_date: project.start_date,
      end_date: project.end_date,
      start_date_type: typeof project.start_date
    })
  })

  const projectTypes = [
    { value: "automation", label: "Automação de Processos (RPA ou Script de Automação)" },
    { value: "data_analytics", label: "Data & Analytics" },
    { value: "digital_development", label: "Desenvolvimento Digital (App / Web)" },
    { value: "design", label: "Design" },
    { value: "consulting", label: "Consultoria" },
    { value: "project_management", label: "Gestão de Projetos/PMO" },
    { value: "system_integration", label: "Integração de Sistemas / APIs" },
    { value: "infrastructure", label: "Infraestrutura/Cloud" },
    { value: "support", label: "Suporte / Sustentação" },
    { value: "training", label: "Treinamento / Capacitação" }
  ]

  const statusOptions = [
    { value: "planning", label: "Planejamento" },
    { value: "commercial_proposal", label: "Proposta Comercial" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "homologation", label: "Homologação" },
    { value: "on_hold", label: "Pausado" },
    { value: "delayed", label: "Atrasado" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" }
  ]
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-500"
      case "commercial_proposal":
        return "bg-purple-500"
      case "in_progress":
        return "bg-yellow-500"
      case "homologation":
        return "bg-orange-500"
      case "on_hold":
        return "bg-gray-500"
      case "delayed":
        return "bg-red-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "planning":
        return "Planejamento"
      case "in_progress":
        return "Em Andamento"
      case "homologation":
        return "Homologação"
      case "on_hold":
        return "Pausado"
      case "delayed":
        return "Atrasado"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      case "commercial_proposal":
        return "Proposta Comercial"
      default:
        return "Planejamento"
    }
  }

  const getProjectTypeText = (projectType: string) => {
    const type = projectTypes.find(t => t.value === projectType)
    return type ? type.label : projectType
  }

  const getProgressWidth = (percentage: number, status: string) => {
    // Se o projeto tem uma porcentagem específica definida, usar ela
    if (percentage && percentage > 0) {
      return Math.min(Math.max(percentage, 0), 100)
    }
    
    // Caso contrário, usar porcentagem baseada no status
    switch (status) {
      case "commercial_proposal":
        return 0  // Proposta comercial ainda não aprovada
      case "planning":
        return 10
      case "in_progress":
        return 50
      case "homologation":
        return 80
      case "completed":
        return 100
      case "delayed":
        return 50
      case "on_hold":
        return 50
      case "cancelled":
        return 0
      default:
        return 10
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    console.log("🔍 [GanttView] formatDate input:", dateString, typeof dateString)
    if (!dateString || dateString === null || dateString === undefined) {
      console.log("❌ [GanttView] Date is null/undefined")
      return "Não definido"
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.log("❌ [GanttView] Invalid date:", dateString)
        return "Não definido"
      }
      // Forçar fuso UTC para consistência com o backend
      const formatted = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
      console.log("✅ [GanttView] Formatted date:", formatted)
      return formatted
    } catch (error) {
      console.log("❌ [GanttView] Date formatting error:", error)
      return "Não definido"
    }
  }

  const isProjectDelayed = (endDate: string, status: string) => {
    if (!endDate || status === "completed" || status === "cancelled") return false
    return new Date(endDate) < new Date()
  }

  const updateExpandedFilter = (key: keyof ExpandedFilters, value: string) => {
    console.log('🔍 Atualizando filtro:', key, 'para:', value)
    console.log('🔍 Estado anterior:', expandedFilters)
    setExpandedFilters(prev => {
      const newState = { ...prev, [key]: value }
      console.log('🔍 Novo estado:', newState)
      return newState
    })
  }

  const getFilteredProjects = () => {
    // Se temos filtros externos, usar allProjects como base e aplicar filtros externos
    // Senão, usar projects (já filtrados pelo dashboard) como base
    let baseProjects = externalFilters ? (allProjects || projects) : projects
    let filtered = [...baseProjects]
    
    console.log('🔍 Filtros atuais (expandedFilters):', expandedFilters)
    console.log('🔍 Filtros externos:', externalFilters)
    console.log('🔍 Projetos base:', baseProjects.length)
    console.log('🔍 Usando filtros externos:', !!externalFilters)

    // Aplicar filtros de busca
    const searchFilter = externalFilters?.search || expandedFilters.search
    if (searchFilter && searchFilter.trim() !== '') {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchFilter.toLowerCase())
      )
      console.log('🔍 Após filtro de busca:', filtered.length)
    }

    // Aplicar filtro de empresa
    const companyFilter = externalFilters?.company || expandedFilters.company
    if (companyFilter && companyFilter !== 'all') {
      console.log('🔍 Filtrando por empresa:', companyFilter)
      console.log('🔍 Projetos antes do filtro de empresa:', filtered.map(p => ({ id: p.id, name: p.name, company_id: p.company_id })))
      filtered = filtered.filter(project => project.company_id === companyFilter)
      console.log('🔍 Após filtro de empresa:', filtered.length)
      console.log('🔍 Projetos filtrados por empresa:', filtered.map(p => ({ id: p.id, name: p.name, company_id: p.company_id })))
    }

    // Aplicar filtro de tipo
    const typeFilter = externalFilters?.type || expandedFilters.type
    if (typeFilter && typeFilter !== 'all') {
      console.log('🔍 Filtrando por tipo:', typeFilter)
      console.log('🔍 Projetos antes do filtro de tipo:', filtered.map(p => ({ id: p.id, name: p.name, project_type: p.project_type })))
      filtered = filtered.filter(project => project.project_type === typeFilter)
      console.log('🔍 Após filtro de tipo:', filtered.length)
    }

    // Aplicar filtro de status
    const statusFilter = externalFilters?.status || expandedFilters.status
    if (statusFilter && statusFilter !== 'all') {
      console.log('🔍 Filtrando por status:', statusFilter)
      console.log('🔍 Projetos antes do filtro de status:', filtered.map(p => ({ id: p.id, name: p.name, status: p.status })))
      
      // Filtro case-insensitive para status
      filtered = filtered.filter(project => 
        project.status?.toLowerCase() === statusFilter.toLowerCase()
      )
      
      console.log('🔍 Após filtro de status:', filtered.length)
      console.log('🔍 Projetos após filtro de status:', filtered.map(p => ({ id: p.id, name: p.name, status: p.status })))
    }

    // Regra adicional (Opção A): quando status = 'completed', incluir projetos
    // concluídos até o fim do mês/ano selecionado no Dashboard.
    // Como o componente não recebe diretamente o mês/ano, usamos created_at/start/end
    // para relaxar a regra caso o projeto não intersecte o mês já aplicado pelo container.
    if (expandedFilters.status === 'completed') {
      // Inclusão de concluídos até o fim do mês selecionado
      const baseYear = selectedYear ?? new Date().getFullYear()
      const baseMonth = (selectedMonth ?? (new Date().getMonth() + 1))
      const endOfMonth = new Date(baseYear, baseMonth, 0)
      filtered = [
        ...filtered,
        ...((allProjects ?? projects).filter(p => p.status === 'completed' && p.end_date && new Date(p.end_date) <= endOfMonth && !filtered.some(f => f.id === p.id)))
      ]
    }

    console.log('🔍 Projetos filtrados finais:', filtered.length)
    // Ordenar por data de início ascendente; nulos por último
    filtered.sort((a, b) => {
      const ad = a?.start_date ? new Date(a.start_date).getTime() : Infinity
      const bd = b?.start_date ? new Date(b.start_date).getTime() : Infinity
      return ad - bd
    })
    return filtered
  }

  // Ordenação para a lista principal (não expandida)
  const sortedMainProjects = [...projects].sort((a, b) => {
    const ad = a?.start_date ? new Date(a.start_date).getTime() : Infinity
    const bd = b?.start_date ? new Date(b.start_date).getTime() : Infinity
    return ad - bd
  })

  const clearExpandedFilters = () => {
    setExpandedFilters({
      search: "",
      company: "all",
      type: "all",
      status: "all"
    })
  }



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingRight className="h-5 w-5 text-cyan-600" />
            Visão Geral dos Cronogramas
          </CardTitle>
          {projects.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Expandir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado</p>
          ) : (
            sortedMainProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600">
                      {project.companies?.name} • {getProjectTypeText(project.project_type)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(project.status || "planning")} text-white border-0`}
                    >
                      {getStatusText(project.status || "planning")}
                    </Badge>
                    {isProjectDelayed(project.end_date, project.status) && (
                      <Badge variant="destructive">Atrasado</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Início: {formatDate(project.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Fim: {formatDate(project.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {project.estimated_hours ? `${project.estimated_hours}h` : ""}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-medium">{getProgressWidth(project.completion_percentage, project.status || "planning")}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(project.status || "planning")}`}
                      style={{ width: `${getProgressWidth(project.completion_percentage, project.status || "planning")}%` }}
                    />
                  </div>
                </div>

                {project.profiles?.full_name && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Responsável:</span> {project.profiles.full_name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Modal Expandida - Fullscreen Custom */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-white z-[9999] overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white">
            <div className="flex items-center gap-2">
              <TrendingRight className="h-5 w-5 text-cyan-600" />
              <h2 className="text-xl font-semibold">Visão Expandida dos Cronogramas</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="flex h-[calc(100vh-80px)]">
            {/* Painel lateral de filtros */}
            <aside className="w-[320px] border-r bg-gray-50 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar projeto..."
                    value={expandedFilters.search}
                    onChange={(e) => updateExpandedFilter("search", e.target.value)}
                    className="pl-12 h-12 text-base bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </label>
                  <Select value={expandedFilters.company} onValueChange={(value) => updateExpandedFilter("company", value)}>
                    <SelectTrigger className="w-full h-12 text-sm bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tipo
                  </label>
                  <Select value={expandedFilters.type} onValueChange={(value) => updateExpandedFilter("type", value)}>
                    <SelectTrigger className="w-full h-12 text-sm bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </label>
                  <Select value={expandedFilters.status} onValueChange={(value) => updateExpandedFilter("status", value)}>
                    <SelectTrigger className="w-full h-12 text-sm bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">Todos os status</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ações */}
                <div className="pt-2 space-y-2">
                  <Button variant="outline" onClick={clearExpandedFilters} className="w-full">
                    Limpar Filtros
                  </Button>
                  <div className="text-xs text-gray-600 text-center">
                    {getFilteredProjects().length} de {projects.length} projetos
                  </div>
                </div>
              </div>
            </aside>

            {/* Lista de projetos */}
            <section className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {getFilteredProjects().length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado</p>
                ) : (
                  getFilteredProjects().map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-600">
                            {project.companies?.name} • {getProjectTypeText(project.project_type)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(project.status || "planning")} text-white border-0`}
                          >
                            {getStatusText(project.status || "planning")}
                          </Badge>
                          {isProjectDelayed(project.end_date, project.status) && (
                            <Badge variant="destructive">Atrasado</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Início: {formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Fim: {formatDate(project.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {project.estimated_hours ? `${project.estimated_hours}h` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {project.estimated_hours ? `${project.estimated_hours}h` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progresso</span>
                          <span className="font-medium">{getProgressWidth(project.completion_percentage, project.status || "planning")}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(project.status || "planning")}`}
                            style={{ width: `${getProgressWidth(project.completion_percentage, project.status || "planning")}%` }}
                          />
                        </div>
                      </div>

                      {project.profiles?.full_name && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Responsável:</span> {project.profiles.full_name}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </Card>
  )
}
