"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


import { Calendar, Clock, TrendingUpIcon as TrendingRight, Maximize2, Search, Building2, Tag, Activity, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GanttChart } from "@/components/admin/gantt-chart"
import { calculateProjectProgress } from "@/lib/calculate-progress"

interface GanttViewProps {
  projects: any[] // já filtrados pelo container
  allProjects?: any[] // lista completa para regras especiais na expandida
  companies?: any[]
  selectedMonth?: number | null
  selectedYear?: number
  userRole?: string | null
}

interface ExpandedFilters {
  search: string
  company: string
  type: string
  status: string[] // Mudança: agora é array para multiselect
}

export function GanttView({ projects, allProjects, companies = [], selectedMonth, selectedYear, userRole }: GanttViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGanttView, setIsGanttView] = useState(false)
  const [projectTasks, setProjectTasks] = useState<{[key: string]: any[]}>({})
  const [loadingTasks, setLoadingTasks] = useState<{[key: string]: boolean}>({})
  const [visibleProjects, setVisibleProjects] = useState(10) // Paginação: 10 projetos por vez
  const [expandedFilters, setExpandedFilters] = useState<ExpandedFilters>({
    search: "",
    company: "all",
    type: "all",
    status: ["planning", "in_progress"] // Padrão inteligente: Planejamento + Em Andamento
  })


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
        return "border-blue-500 text-blue-700 bg-blue-100"
      case "commercial_proposal":
        return "border-purple-500 text-purple-700 bg-purple-100"
      case "in_progress":
        return "border-yellow-500 text-yellow-700 bg-yellow-200"
      case "homologation":
        return "border-orange-500 text-orange-700 bg-orange-100"
      case "on_hold":
        return "border-gray-500 text-gray-700 bg-gray-100"
      case "delayed":
        return "border-red-500 text-red-700 bg-red-100"
      case "completed":
        return "border-green-500 text-green-700 bg-green-100"
      case "cancelled":
        return "border-red-600 text-red-700 bg-red-100"
      default:
        return "border-gray-500 text-gray-700 bg-gray-100"
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

  const getProgressWidth = (projectId: string, percentage: number, status: string) => {
    // 1. Prioridade: calcular baseado nas tasks reais do projeto
    const tasks = projectTasks[projectId]
    if (tasks && tasks.length > 0) {
      const calculatedProgress = calculateProjectProgress(tasks)
      console.log(`🔍 [GanttView] Progresso calculado para projeto ${projectId}:`, {
        tasksCount: tasks.length,
        calculatedProgress,
        oldProgress: percentage,
        status
      })
      return calculatedProgress
    }
    
    // 2. Se o projeto tem uma porcentagem específica definida no banco, usar ela
    if (percentage && percentage > 0) {
      return Math.min(Math.max(percentage, 0), 100)
    }
    
    // 3. Fallback: usar porcentagem baseada no status do projeto
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

  // Função para obter o nome da empresa de forma segura
  const getCompanyName = (project: any) => {
    // Primeiro tenta acessar via relação (visão admin)
    if (project.companies?.name) {
      return project.companies.name
    }
    
    // Se não tiver relação, busca na lista de companies passada via props (visão cliente)
    if (companies.length > 0) {
      return companies[0].name // Na visão cliente, sempre será a empresa do usuário
    }
    
    return "Empresa não definida"
  }

  const isProjectDelayed = (endDate: string, status: string) => {
    if (!endDate || status === "completed" || status === "cancelled") return false
    return new Date(endDate) < new Date()
  }

  const updateExpandedFilter = (key: keyof ExpandedFilters, value: string | string[]) => {
    console.log('🔍 Atualizando filtro:', key, 'para:', value)
    console.log('🔍 Estado anterior:', expandedFilters)
    setExpandedFilters(prev => {
      const newState = { ...prev, [key]: value }
      console.log('🔍 Novo estado:', newState)
      return newState
    })
  }

  // Função específica para toggle de status
  const toggleStatusFilter = (statusValue: string) => {
    setExpandedFilters(prev => {
      const currentStatus = prev.status
      const newStatus = currentStatus.includes(statusValue)
        ? currentStatus.filter(s => s !== statusValue)
        : [...currentStatus, statusValue]
      
      return { ...prev, status: newStatus }
    })
  }

  const getFilteredProjects = () => {
    // Na visão expandida, usar allProjects (todos os projetos)
    // Na visão normal, usar projects (apenas os 5 últimos)
    let baseProjects = isExpanded ? (allProjects || []) : projects
    let filtered = [...baseProjects]
    
    console.log('🔍 Filtros atuais:', expandedFilters)
    console.log('🔍 Projetos base:', baseProjects.length)

    // Aplicar filtros de busca
    if (expandedFilters.search && expandedFilters.search.trim() !== '') {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(expandedFilters.search.toLowerCase())
      )
      console.log('🔍 Após filtro de busca:', filtered.length)
    }

    // Aplicar filtro de empresa
    if (expandedFilters.company && expandedFilters.company !== 'all') {
      console.log('🔍 Filtrando por empresa:', expandedFilters.company)
      console.log('🔍 Projetos antes do filtro de empresa:', filtered.map(p => ({ id: p.id, name: p.name, company_id: p.company_id })))
      filtered = filtered.filter(project => project.company_id === expandedFilters.company)
      console.log('🔍 Após filtro de empresa:', filtered.length)
      console.log('🔍 Projetos filtrados por empresa:', filtered.map(p => ({ id: p.id, name: p.name, company_id: p.company_id })))
    }

    // Aplicar filtro de tipo
    if (expandedFilters.type && expandedFilters.type !== 'all') {
      console.log('🔍 Filtrando por tipo:', expandedFilters.type)
      console.log('🔍 Projetos antes do filtro de tipo:', filtered.map(p => ({ id: p.id, name: p.name, project_type: p.project_type })))
      filtered = filtered.filter(project => project.project_type === expandedFilters.type)
      console.log('🔍 Após filtro de tipo:', filtered.length)
    }

    // Aplicar filtro de status (multiselect)
    if (expandedFilters.status && expandedFilters.status.length > 0) {
      console.log('🔍 Filtrando por status:', expandedFilters.status)
      console.log('🔍 Projetos antes do filtro de status:', filtered.map(p => ({ id: p.id, name: p.name, status: p.status })))
      
      // Filtro multiselect para status
      filtered = filtered.filter(project => 
        expandedFilters.status.includes(project.status)
      )
      
      console.log('🔍 Após filtro de status:', filtered.length)
      console.log('🔍 Projetos após filtro de status:', filtered.map(p => ({ id: p.id, name: p.name, status: p.status })))
    }

    // Regra adicional (Opção A): quando status inclui 'completed', incluir projetos
    // concluídos até o fim do mês/ano selecionado no Dashboard.
    // Como o componente não recebe diretamente o mês/ano, usamos created_at/start/end
    // para relaxar a regra caso o projeto não intersecte o mês já aplicado pelo container.
    if (expandedFilters.status.includes('completed')) {
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
      status: ["planning", "in_progress"] // Reset para padrão inteligente
    })
    setVisibleProjects(10) // Reset paginação
  }

  // Função para obter todos os projetos filtrados (sem paginação)
  const getAllFilteredProjects = () => {
    let baseProjects = isExpanded ? (allProjects || []) : projects
    let filtered = [...baseProjects]
    
    if (expandedFilters.search && expandedFilters.search.trim() !== '') {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(expandedFilters.search.toLowerCase())
      )
    }

    if (expandedFilters.company && expandedFilters.company !== 'all') {
      filtered = filtered.filter(project => project.company_id === expandedFilters.company)
    }

    if (expandedFilters.type && expandedFilters.type !== 'all') {
      filtered = filtered.filter(project => project.project_type === expandedFilters.type)
    }

    if (expandedFilters.status && expandedFilters.status.length > 0) {
      filtered = filtered.filter(project => 
        expandedFilters.status.includes(project.status)
      )
    }

    if (expandedFilters.status.includes('completed')) {
      const baseYear = selectedYear ?? new Date().getFullYear()
      const baseMonth = (selectedMonth ?? (new Date().getMonth() + 1))
      const endOfMonth = new Date(baseYear, baseMonth, 0)
      filtered = [
        ...filtered,
        ...((allProjects ?? projects).filter(p => p.status === 'completed' && p.end_date && new Date(p.end_date) <= endOfMonth && !filtered.some(f => f.id === p.id)))
      ]
    }

    const sortedProjects = filtered.sort((a, b) => {
      const ad = a?.start_date ? new Date(a.start_date).getTime() : Infinity
      const bd = b?.start_date ? new Date(b.start_date).getTime() : Infinity
      return ad - bd
    })

    // Retornar apenas os projetos visíveis (paginação)
    return sortedProjects.slice(0, visibleProjects)
  }

  // Função para carregar mais projetos
  const loadMoreProjects = () => {
    setVisibleProjects(prev => prev + 10)
  }

  // Função para buscar tarefas de um projeto
  const fetchProjectTasks = async (projectId: string) => {
    if (projectTasks[projectId] || loadingTasks[projectId]) {
      return // Já carregado ou carregando
    }

    setLoadingTasks(prev => ({ ...prev, [projectId]: true }))

    try {
      const supabase = createClient()
      
      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          responsible,
          delay_justification,
          original_end_date,
          actual_end_date,
          delay_created_at,
          delay_created_by
        `)
        .eq("project_id", projectId)
        .order("start_date", { ascending: true })

      if (error) throw error

      // Transformar dados para o formato esperado pelo GanttChart
      const formattedTasks = (tasksData || [])
        .map((task: any) => ({
          id: task.id,
          name: task.name,
          start_date: task.start_date,
          end_date: task.end_date,
          status: task.status,
          responsible: task.responsible || '—',
          description: task.description || '',
          delay_justification: task.delay_justification,
          original_end_date: task.original_end_date,
          actual_end_date: task.actual_end_date,
          delay_created_at: task.delay_created_at,
          delay_created_by: task.delay_created_by
        }))
        .filter((t: any) => !!t.start_date && !!t.end_date)

      setProjectTasks(prev => ({ ...prev, [projectId]: formattedTasks }))
      console.log(`✅ [GanttView] Tasks carregadas para projeto ${projectId}:`, {
        tasksCount: formattedTasks.length,
        tasks: formattedTasks.map(t => ({ name: t.name, status: t.status }))
      })
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
      setProjectTasks(prev => ({ ...prev, [projectId]: [] }))
    } finally {
      setLoadingTasks(prev => ({ ...prev, [projectId]: false }))
    }
  }

  // Carregar tarefas de todos os projetos para cálculo de progresso
  useEffect(() => {
    // Carregar tasks de todos os projetos visíveis para cálculo de progresso
    getFilteredProjects().forEach(project => {
      fetchProjectTasks(project.id)
    })
  }, [projects, expandedFilters])

  // Carregar tarefas quando a visão Gantt for ativada (mantido para compatibilidade)
  useEffect(() => {
    if (isGanttView) {
      getFilteredProjects().forEach(project => {
        fetchProjectTasks(project.id)
      })
    }
  }, [isGanttView])

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 shadow-md">
      {/* Círculo decorativo */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-2xl" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-md">
            <TrendingRight className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
              Visão Geral dos Cronogramas
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">Acompanhe o progresso de cada projeto</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado</p>
          ) : (
            sortedMainProjects.map((project) => (
              <div key={project.id} className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group shadow-sm">
                {/* Barra colorida lateral baseada no status com gradiente */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                  style={{
                    background: project.status === 'completed' ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' :
                               project.status === 'in_progress' ? 'linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)' :
                               project.status === 'delayed' ? 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)' :
                               project.status === 'planning' ? 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)' :
                               project.status === 'cancelled' ? 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)' :
                               project.status === 'commercial_proposal' ? 'linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)' :
                               project.status === 'on_hold' ? 'linear-gradient(180deg, #eab308 0%, #f59e0b 100%)' :
                               project.status === 'homologation' ? 'linear-gradient(180deg, #f97316 0%, #eab308 100%)' :
                               'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)'
                  }}
                />
                
                {/* Círculo decorativo sutil */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-xl group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-700 transition-colors truncate">{project.name}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        {getCompanyName(project)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {getProjectTypeText(project.project_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Badge 
                      className={`border-0 shadow-lg font-bold px-4 py-1.5 text-xs hover:shadow-xl transition-all ${
                        project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        project.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                        project.status === 'delayed' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
                        project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white' :
                        project.status === 'cancelled' ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white' :
                        project.status === 'commercial_proposal' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                        project.status === 'on_hold' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                        project.status === 'homologation' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' :
                        'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                      }`}
                    >
                      {getStatusText(project.status || "planning")}
                    </Badge>
                    {isProjectDelayed(project.end_date, project.status) && (
                      <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 shadow-lg font-bold px-3 py-1 animate-pulse">
                        ⚠️ Atrasado
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Início</div>
                      <div className="text-sm font-semibold text-slate-700">{formatDate(project.start_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                    <div className="p-1.5 bg-indigo-50 rounded-md">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Término</div>
                      <div className="text-sm font-semibold text-slate-700">{formatDate(project.end_date)}</div>
                    </div>
                  </div>
                  {userRole !== 'admin_operacional' && (
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                      <div className="p-1.5 bg-green-50 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Orçamento</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {project.budget ? `R$ ${project.budget.toLocaleString("pt-BR")}` : "N/A"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Progresso do Projeto</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {getProgressWidth(project.id, project.completion_percentage, project.status || "planning")}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${getProgressWidth(project.id, project.completion_percentage, project.status || "planning")}%`,
                        background: project.status === 'completed' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                                   project.status === 'delayed' ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' :
                                   project.status === 'in_progress' ? 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)' :
                                   project.status === 'planning' ? 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)' :
                                   project.status === 'cancelled' ? 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)' :
                                   project.status === 'commercial_proposal' ? 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)' :
                                   'linear-gradient(90deg, #cbd5e1 0%, #94a3b8 100%)'
                      }}
                    />
                  </div>
                </div>

                {project.profiles?.full_name && (
                  <div className="mt-4 pt-3 border-t border-slate-100 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-50 rounded-md">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Responsável</div>
                        <div className="text-sm font-semibold text-slate-700">{project.profiles.full_name}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Botão Ver + */}
        {projects.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-center">
            <Button
              variant="default"
              onClick={() => setIsExpanded(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Ver +
            </Button>
          </div>
        )}
      </CardContent>

      {/* Modal Expandida - Fullscreen Custom */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 z-[9999] overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Círculos animados de fundo */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-md">
                <TrendingRight className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Todos os Cronogramas
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsGanttView(!isGanttView)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                {isGanttView ? 'Visão Cards' : 'Visão Gantt'}
              </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            </div>
          </div>
          
          <div className="flex h-[calc(100vh-80px)] relative z-10">
            {/* Painel lateral de filtros */}
            <aside className={`${isGanttView ? 'w-0 opacity-0' : 'w-[320px]'} border-r border-slate-200/60 bg-white/60 backdrop-blur-md p-6 overflow-y-auto shadow-sm transition-all duration-300`}>
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Filtros</h3>
                </div>
                
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar projeto..."
                    value={expandedFilters.search}
                    onChange={(e) => updateExpandedFilter("search", e.target.value)}
                    className="pl-10 h-11 text-sm bg-white border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1 bg-blue-50 rounded">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    </div>
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
                  <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1 bg-indigo-50 rounded">
                      <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
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

                {/* Status - Multiselect */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-3 block flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1 bg-purple-50 rounded">
                      <Activity className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    Status ({expandedFilters.status.length} selecionados)
                  </label>
                  <div className="space-y-2 bg-white rounded-lg border border-gray-300 p-3">
                      {statusOptions.map((status) => (
                      <label key={status.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          checked={expandedFilters.status.includes(status.value)}
                          onChange={() => toggleStatusFilter(status.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-slate-700 flex-1">
                          {status.label}
                        </span>
                        {expandedFilters.status.includes(status.value) && (
                          <div className={`w-2 h-2 rounded-full ${
                            status.value === 'completed' ? 'bg-green-500' :
                            status.value === 'in_progress' ? 'bg-blue-500' :
                            status.value === 'delayed' ? 'bg-red-500' :
                            status.value === 'planning' ? 'bg-blue-400' :
                            status.value === 'cancelled' ? 'bg-gray-500' :
                            status.value === 'commercial_proposal' ? 'bg-purple-500' :
                            status.value === 'on_hold' ? 'bg-yellow-500' :
                            status.value === 'homologation' ? 'bg-orange-500' :
                            'bg-slate-400'
                          }`} />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-2 space-y-2">
                  <Button variant="outline" onClick={clearExpandedFilters} className="w-full">
                    Limpar Filtros
                  </Button>
                  <div className="text-xs text-gray-600 text-center">
                    {getAllFilteredProjects().length} projeto{getAllFilteredProjects().length !== 1 ? 's' : ''} encontrado{getAllFilteredProjects().length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </aside>

            {/* Lista de projetos */}
            <section className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {isGanttView ? (
                  <div className="space-y-8">
                    <div className="text-center py-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                          Visão Unificada Gantt
                        </h3>
                      </div>
                      <p className="text-slate-600">Cronogramas de todos os projetos em uma única visualização</p>
                      <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">
                          {getFilteredProjects().length} projeto{getFilteredProjects().length !== 1 ? 's' : ''} encontrado{getFilteredProjects().length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {getFilteredProjects().map((project, index) => (
                      <div key={project.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-slate-900">{project.name}</h4>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-slate-600">
                                  <strong>Empresa:</strong> {getCompanyName(project)}
                                </span>
                                <span className="text-sm text-slate-600">
                                  <strong>Período:</strong> {formatDate(project.start_date)} - {formatDate(project.end_date)}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className={`border-0 shadow-md font-bold px-3 py-1 text-xs ${
                                project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                project.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                project.status === 'delayed' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
                                project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white' :
                                project.status === 'cancelled' ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white' :
                                project.status === 'commercial_proposal' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                                project.status === 'on_hold' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                                project.status === 'homologation' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' :
                                'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                              }`}
                            >
                              {getStatusText(project.status || "planning")}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          {loadingTasks[project.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-sm text-slate-600">Carregando tarefas...</p>
                              </div>
                            </div>
                          ) : (
                          <GanttChart 
                            tasks={projectTasks[project.id] || []}
                            projectStartDate={project.start_date}
                            projectEndDate={project.end_date}
                            projectName={project.name}
                            defaultExpanded={false}
                            hideControls={true} // Esconder ícones na visão unificada
                          />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : getFilteredProjects().length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado</p>
                ) : (
                  getFilteredProjects().map((project) => (
                    <div key={project.id} className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group shadow-sm">
                      {/* Barra colorida lateral baseada no status com gradiente */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                        style={{
                          background: project.status === 'completed' ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' :
                                     project.status === 'in_progress' ? 'linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)' :
                                     project.status === 'delayed' ? 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)' :
                                     project.status === 'planning' ? 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)' :
                                     project.status === 'cancelled' ? 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)' :
                                     project.status === 'commercial_proposal' ? 'linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)' :
                                     project.status === 'on_hold' ? 'linear-gradient(180deg, #eab308 0%, #f59e0b 100%)' :
                                     project.status === 'homologation' ? 'linear-gradient(180deg, #f97316 0%, #eab308 100%)' :
                                     'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)'
                        }}
                      />
                      
                      {/* Círculo decorativo sutil */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-xl group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                      
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-700 transition-colors truncate">{project.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                              {getCompanyName(project)}
                            </span>
                            <span className="text-sm text-slate-500">
                              {getProjectTypeText(project.project_type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Badge 
                            className={`border-0 shadow-lg font-bold px-4 py-1.5 text-xs hover:shadow-xl transition-all ${
                              project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                              project.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                              project.status === 'delayed' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
                              project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white' :
                              project.status === 'cancelled' ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white' :
                              project.status === 'commercial_proposal' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                              project.status === 'on_hold' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                              project.status === 'homologation' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' :
                              'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                            }`}
                          >
                            {getStatusText(project.status || "planning")}
                          </Badge>
                          {isProjectDelayed(project.end_date, project.status) && (
                            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 shadow-lg font-bold px-3 py-1 animate-pulse">
                              ⚠️ Atrasado
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 relative z-10">
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                          <div className="p-1.5 bg-blue-50 rounded-md">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Início</div>
                            <div className="text-sm font-semibold text-slate-700">{formatDate(project.start_date)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                          <div className="p-1.5 bg-indigo-50 rounded-md">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Término</div>
                            <div className="text-sm font-semibold text-slate-700">{formatDate(project.end_date)}</div>
                          </div>
                        </div>
                        {userRole !== 'admin_operacional' && (
                          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100">
                            <div className="p-1.5 bg-green-50 rounded-md">
                              <Clock className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Orçamento</div>
                              <div className="text-sm font-semibold text-slate-700">
                                {project.budget ? `R$ ${project.budget.toLocaleString("pt-BR")}` : "N/A"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 font-medium">Progresso do Projeto</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {getProgressWidth(project.id, project.completion_percentage, project.status || "planning")}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${getProgressWidth(project.id, project.completion_percentage, project.status || "planning")}%`,
                              background: project.status === 'completed' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                                         project.status === 'delayed' ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' :
                                         project.status === 'in_progress' ? 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)' :
                                         project.status === 'planning' ? 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)' :
                                         project.status === 'cancelled' ? 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)' :
                                         project.status === 'commercial_proposal' ? 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)' :
                                         project.status === 'on_hold' ? 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)' :
                                         project.status === 'homologation' ? 'linear-gradient(90deg, #f97316 0%, #eab308 100%)' :
                                         'linear-gradient(90deg, #cbd5e1 0%, #94a3b8 100%)'
                            }}
                          />
                        </div>
                      </div>

                      {project.profiles?.full_name && (
                        <div className="mt-4 pt-3 border-t border-slate-100 relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-50 rounded-md">
                              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Responsável</div>
                              <div className="text-sm font-semibold text-slate-700">{project.profiles.full_name}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {/* Botão Load More */}
                {getAllFilteredProjects().length > visibleProjects && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="text-center">
                      <div className="mb-4 text-sm text-slate-600">
                        Mostrando {getFilteredProjects().length} de {getAllFilteredProjects().length} projetos
                      </div>
                      <Button
                        onClick={loadMoreProjects}
                        variant="outline"
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        Carregar Mais 10
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </Card>
  )
}
