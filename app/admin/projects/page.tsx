"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, List, Grid3X3, Kanban, Search, X, Download } from "lucide-react"
import Link from "next/link"
import { ProjectFilters } from "@/components/admin/project-filters"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from 'xlsx'

// ID da Copersucar para exibir campo Safra
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  project_type: string | null
  category: string
  start_date: string | null
  end_date: string | null
  predicted_start_date: string | null
  predicted_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  budget: number | null
  created_at: string
  company_id: string
  hourly_rate: number | null
  technical_responsible: string | null
  key_user: string | null
  safra: string | null
  tenant_id: string | null
}

interface Company {
  id: string
  name: string
}

interface ProjectFilters {
  company_id: string
  status: string
  priority: string
  category: string
  search: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyNames, setCompanyNames] = useState<{ [key: string]: string }>({})
  const [userRole, setUserRole] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProjectFilters>({
    company_id: "all",
    status: "all",
    priority: "all",
    category: "all",
    search: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  
  // Filtrar projetos por busca no FRONTEND (instantâneo)
  const filteredProjects = useMemo(() => {
    if (!filters.search) return projects
    
    const searchLower = filters.search.toLowerCase()
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      (project.description && project.description.toLowerCase().includes(searchLower))
    )
  }, [projects, filters.search])
  
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.company_id && filters.company_id !== "all") count++
    if (filters.status && filters.status !== "all") count++
    if (filters.priority && filters.priority !== "all") count++
    if (filters.category && filters.category !== "all") count++
    if (filters.search && filters.search.trim() !== "") count++
    return count
  }, [filters])
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [projectsPerPage] = useState(12)

  const formatDateUTC = (iso: string) => {
    try {
      if (!iso) return ""
      const d = new Date(iso)
      return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d)
    } catch {
      return new Date(iso).toLocaleDateString("pt-BR")
    }
  }

  useEffect(() => {
    fetchCompanies()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  // Buscar projetos com filtros no backend (exceto busca por nome)
  // Não incluir currentPage pois paginação agora é no frontend
  useEffect(() => {
    fetchProjects()
  }, [filters.company_id, filters.status, filters.priority, filters.category])

  // Resetar página quando busca mudar
  useEffect(() => {
    if (filters.search) {
      setCurrentPage(1)
    }
  }, [filters.search])

  const fetchCompanies = async () => {
    try {
      setIsLoading(true)
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
        .from("companies")
        .select("id, name")
        .order("name")

      // Se for Client Admin, filtrar por tenant_id
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        }
      } 
      // Se for Admin Normal ou Admin Operacional, filtrar apenas empresas sem tenant_id (aplicação principal)
      else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro) - tenant_id = NULL + todos os tenants

      const { data: companiesData, error: companiesError } = await query

      if (companiesError) throw companiesError
      setCompanies(companiesData || [])

      // Criar mapeamento de nomes de empresas
      const companyNamesMap = (companiesData || []).reduce((acc: { [key: string]: string }, company: Company) => {
        acc[company.id] = company.name
        return acc
      }, {} as { [key: string]: string })

      setCompanyNames(companyNamesMap)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
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

      // Buscar TODOS os projetos (paginação será feita no frontend)
      let query = supabase
        .from("projects")
        .select(`id, name, description, status, priority, project_type, category, start_date, end_date, predicted_start_date, predicted_end_date, actual_start_date, actual_end_date, budget, created_at, company_id, tenant_id, hourly_rate, technical_responsible, key_user, safra`)
        .order("created_at", { ascending: false })

      // Se for Client Admin, filtrar por tenant_id
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        }
      } 
      // Se for Admin Normal, filtrar apenas projetos sem tenant_id (criados por Admin Master/Normal)
      else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      // Aplicar filtros adicionais
      if (filters.company_id && filters.company_id !== "all") {
        query = query.eq("company_id", filters.company_id)
      }
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }
      if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority)
      }
      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category)
      }
      // Busca por nome agora é feita no frontend (instantânea)

      const { data, error } = await query
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cálculos de paginação baseados em projetos filtrados
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage) || 1
    const startIndex = (currentPage - 1) * projectsPerPage
    const endIndex = startIndex + projectsPerPage
    const currentProjects = filteredProjects.slice(startIndex, endIndex)
    
    return { totalPages, startIndex, endIndex, currentProjects }
  }, [filteredProjects, currentPage, projectsPerPage])
  
  const { totalPages, startIndex, endIndex, currentProjects } = paginationData

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
      case "homologation":
        return "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
      case "on_hold":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
      case "delayed":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white"
      case "cancelled":
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white"
      case "commercial_proposal":
        return "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-600 text-white"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "in_progress":
        return "Em Andamento"
      case "homologation":
        return "Homologação"
      case "on_hold":
        return "Pausado"
      case "delayed":
        return "Atrasado"
      case "cancelled":
        return "Cancelado"
      case "commercial_proposal":
        return "Proposta Comercial"
      default:
        return "Planejamento"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "project":
        return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
      case "improvement":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-600 text-white"
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case "project":
        return "Projeto"
      case "improvement":
        return "Melhoria"
      default:
        return "Projeto"
    }
  }

  const getProjectTypeText = (projectType: string | null) => {
    if (!projectType) return "Não definido"
    
    switch (projectType) {
      case "automation":
        return "Automação"
      case "data_analytics":
        return "Data & Analytics"
      case "digital_development":
        return "Desenvolvimento Digital"
      case "design":
        return "Design"
      case "consulting":
        return "Consultoria"
      case "project_management":
        return "Gestão de Projetos"
      case "system_integration":
        return "Integração de Sistemas"
      case "infrastructure":
        return "Infraestrutura/Cloud"
      case "support":
        return "Suporte"
      case "training":
        return "Treinamento"
      default:
        return projectType
    }
  }

  const getProjectTypeColor = (projectType: string | null) => {
    if (!projectType) return "bg-gradient-to-r from-gray-500 to-slate-600 text-white"
    
    switch (projectType) {
      case "automation":
        return "bg-gradient-to-r from-purple-500 to-violet-600 text-white"
      case "data_analytics":
        return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
      case "digital_development":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
      case "design":
        return "bg-gradient-to-r from-pink-500 to-rose-600 text-white"
      case "consulting":
        return "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
      case "project_management":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
      case "system_integration":
        return "bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
      case "infrastructure":
        return "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
      case "support":
        return "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
      case "training":
        return "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white"
    }
  }

  // Função de exportação para Excel
  const handleExportToExcel = () => {
    // Preparar dados para exportação (TODOS os projetos visíveis para o admin)
    const exportData = projects.map(project => {
      const companyName = companyNames[project.company_id] || 'Não informado'
      
      const row: any = {
        'Nome do Projeto': project.name || 'Não informado',
        'Empresa': companyName,
        'Tipo de Projeto': getProjectTypeText(project.project_type),
        'Categoria': getCategoryText(project.category),
        'Status': getStatusText(project.status),
      }

      // Orçamento - NÃO mostrar para Admin Operacional
      if (userRole !== 'admin_operacional') {
        row['Orçamento'] = project.budget ? `R$ ${Number(project.budget).toLocaleString('pt-BR')}` : 'Não informado'
      }

      // Safra apenas para projetos da Copersucar
      if (project.company_id === COPERSUCAR_ID) {
        row['Safra'] = project.safra || 'Não informado'
      }

      // Datas Planejadas
      row['Data Início Planejado'] = project.start_date 
        ? new Date(project.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'
      
      row['Data Término Planejado'] = project.end_date 
        ? new Date(project.end_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'

      // Datas Previstas
      row['Data Início Previsto'] = project.predicted_start_date 
        ? new Date(project.predicted_start_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'
      
      row['Data Término Previsto'] = project.predicted_end_date 
        ? new Date(project.predicted_end_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'

      // Datas Reais
      row['Data Início Real'] = project.actual_start_date 
        ? new Date(project.actual_start_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'
      
      row['Data Término Real'] = project.actual_end_date 
        ? new Date(project.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : 'Não informado'

      // Responsáveis
      row['Responsável Técnico'] = project.technical_responsible || 'Não informado'
      row['Key User'] = project.key_user || 'Não informado'

      return row
    })

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Ajustar largura das colunas (dinâmico baseado no perfil)
    const colWidths = [
      { wch: 30 }, // Nome do Projeto
      { wch: 25 }, // Empresa
      { wch: 25 }, // Tipo de Projeto
      { wch: 12 }, // Categoria
      { wch: 15 }, // Status
    ]

    // Orçamento - apenas para Admin e Admin Master
    if (userRole !== 'admin_operacional') {
      colWidths.push({ wch: 15 }) // Orçamento
    }

    colWidths.push(
      { wch: 12 }, // Safra (aparece em algumas linhas)
      { wch: 20 }, // Data Início Planejado
      { wch: 20 }, // Data Término Planejado
      { wch: 20 }, // Data Início Previsto
      { wch: 20 }, // Data Término Previsto
      { wch: 20 }, // Data Início Real
      { wch: 20 }, // Data Término Real
      { wch: 25 }, // Responsável Técnico
      { wch: 25 }  // Key User
    )

    ws['!cols'] = colWidths

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Projetos')

    // Gerar nome do arquivo
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    const roleText = userRole === 'admin_master' ? 'Todos' : 'Admin'
    const fileName = `Projetos_${roleText}_${date}.xlsx`

    // Download
    XLSX.writeFile(wb, fileName)
  }

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

        {/* Grid de cards skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            {/* Paginação skeleton */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-52" />
                <div className="flex items-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
          <p className="text-muted-foreground">
            Gerencie todos os projetos do sistema
            {filters.search ? (
              <span className="ml-2 text-blue-600">• {filteredProjects.length} de {projects.length} projetos</span>
            ) : (
              <span className="ml-2 text-blue-600">• {projects.length} projetos</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportToExcel}
            className="flex items-center gap-2"
            title="Exportar todos os projetos para Excel"
          >
            <Download className="h-4 w-4" />
            Excel
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-xs font-medium">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
            <Link href="/admin/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Controles de Visualização */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Barra de Busca Rápida */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar projetos por nome..."
            value={filters.search}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, search: e.target.value }))
              setCurrentPage(1) // Resetar para primeira página ao buscar
            }}
            className="pl-10 pr-10 h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controles de Visualização */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visualização:</span>
          <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none border-r-2 border-slate-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`rounded-none ${viewMode === 'cards' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white' : ''}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProjectFilters 
        filters={filters}
        onFiltersChange={setFilters}
        companies={companies}
        isOpen={showFilters}
        onOpenChange={setShowFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
          <CardDescription>
            {(filters.company_id !== "all" || filters.status !== "all" || filters.priority !== "all" || filters.search) ? (
              <>
                Projetos filtrados • {filteredProjects.length} resultado{filteredProjects.length !== 1 ? 's' : ''}
                {totalPages > 1 && (
                  <span className="ml-2 text-blue-600">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </>
            ) : (
              <>
                Todos os projetos cadastrados no sistema
                {totalPages > 1 && (
                  <span className="ml-2 text-blue-600">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {currentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                      <Badge className={getCategoryColor(project.category)}>{getCategoryText(project.category)}</Badge>
                      <Badge className={getProjectTypeColor(project.project_type)}>{getProjectTypeText(project.project_type)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description || "Sem descrição"}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Empresa: {companyNames[project.company_id] || "Desconhecida"}</span>
                      {userRole !== 'admin_operacional' && project.budget && (
                        <span>Orçamento: R$ {Number(project.budget).toLocaleString("pt-BR")}</span>
                      )}
                      {project.company_id === COPERSUCAR_ID && project.safra && (
                        <span>Safra: {project.safra}</span>
                      )}
                      {project.start_date && (
                        <span>Início Planejado: {formatDateUTC(project.start_date)}</span>
                      )}
                      {project.end_date && <span>Término Planejado: {formatDateUTC(project.end_date)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" asChild className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                      <Link href={`/admin/projects/${project.id}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Cronograma
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentProjects.map((project) => (
                <div key={project.id} className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col h-full group">
                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-indigo-400/0 to-purple-400/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  
                  <div className="relative flex-1 space-y-4">
                    {/* Header do Card */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base leading-tight text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors flex-1">{project.name}</h3>
                        <Link 
                          href={`/admin/flowtasks/${project.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group/icon"
                          title="Abrir FlowTasks (Kanban)"
                        >
                          <Kanban className="h-4 w-4 group-hover/icon:scale-110 transition-transform duration-200" />
                        </Link>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{project.description || "Sem descrição"}</p>
                    </div>
                    
                    {/* Badges com gradiente */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`text-xs font-semibold shadow-sm ${getStatusColor(project.status)}`}>{getStatusText(project.status)}</Badge>
                      <Badge className={`text-xs font-semibold shadow-sm ${getCategoryColor(project.category)}`}>{getCategoryText(project.category)}</Badge>
                    </div>
                    
                    {/* Informações com ícones */}
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="font-medium">Empresa:</span>
                        <span className="text-slate-600">{companyNames[project.company_id] || "Desconhecida"}</span>
                      </div>
                      {userRole !== 'admin_operacional' && project.budget && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="font-medium">Orçamento:</span>
                          <span className="text-green-700 font-semibold">R$ {Number(project.budget).toLocaleString("pt-BR")}</span>
                        </div>
                      )}
                      {project.company_id === COPERSUCAR_ID && project.safra && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="font-medium">Safra:</span>
                          <span className="text-purple-700 font-semibold">{project.safra}</span>
                        </div>
                      )}
                      {project.start_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="font-medium">Início Planejado:</span>
                          <span className="text-slate-600">{formatDateUTC(project.start_date)}</span>
                        </div>
                      )}
                      {project.end_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="font-medium">Término Planejado:</span>
                          <span className="text-slate-600">{formatDateUTC(project.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botões modernos com gradiente sutil */}
                  <div className="relative flex items-center gap-2 pt-4 mt-auto">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 font-medium">
                      <Link href={`/admin/projects/${project.id}`}>
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Cronograma
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 font-medium">
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {currentProjects.length === 0 && (
            <div className="text-center py-12">
              {(filters.company_id !== "all" || filters.status !== "all" || filters.priority !== "all" || filters.search) ? (
                <div>
                  <p className="text-muted-foreground mb-2">Nenhum projeto encontrado com os filtros aplicados</p>
                  <Button variant="outline" onClick={() => setFilters({
                    company_id: "all",
                    status: "all",
                    priority: "all",
                    category: "all",
                    search: ""
                  })}>
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum projeto cadastrado</p>
              )}
            </div>
          )}

          {/* Paginação */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProjects.length)} de {filteredProjects.length} projetos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Números das páginas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className={`w-8 h-8 p-0 ${currentPage === pageNumber ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md' : ''}`}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
