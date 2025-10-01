"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, List, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { ProjectFilters } from "@/components/admin/project-filters"
import { createClient } from "@/lib/supabase/client"

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
  budget: number | null
  created_at: string
  company_id: string
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
  // Quando buscar do backend já aplicando filtros, não precisamos manter uma cópia filtrada
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
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

  // Buscar projetos com filtros e paginação no backend (debounced para busca)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects()
    }, filters.search ? 200 : 0)
    return () => clearTimeout(handler)
  }, [filters, currentPage, projectsPerPage])

  const fetchCompanies = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Buscar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")

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

      const start = (currentPage - 1) * projectsPerPage
      const end = start + projectsPerPage - 1

      let query = supabase
        .from("projects")
        .select(
          `id, name, description, status, priority, project_type, category, start_date, end_date, budget, created_at, company_id`,
          { count: "exact" }
        )
        .order("start_date", { ascending: true, nullsFirst: false })

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
      if (filters.search) {
        const s = filters.search.trim()
        // name ILIKE OR description ILIKE
        query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`)
      }

      const { data, error, count } = await query.range(start, end)
      if (error) throw error
      setProjects(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cálculos de paginação
  const totalPages = Math.ceil((totalCount || 0) / projectsPerPage) || 1
  const startIndex = (currentPage - 1) * projectsPerPage
  const endIndex = startIndex + projectsPerPage
  const currentProjects = projects

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
            <span className="ml-2 text-blue-600">• {totalCount} projeto{totalCount !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Botões de visualização */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Visualização:</span>
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-r-none border-r"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="rounded-l-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
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
                Projetos filtrados • {totalCount} resultado{totalCount !== 1 ? 's' : ''}
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
                      {project.start_date && (
                        <span>Início: {formatDateUTC(project.start_date)}</span>
                      )}
                      {project.end_date && <span>Término: {formatDateUTC(project.end_date)}</span>}
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
                      <h3 className="font-bold text-base leading-tight text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">{project.name}</h3>
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
                      {project.start_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="font-medium">Início:</span>
                          <span className="text-slate-600">{formatDateUTC(project.start_date)}</span>
                        </div>
                      )}
                      {project.end_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="font-medium">Término:</span>
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
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, totalCount)} de {totalCount} projetos
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
                        className="w-8 h-8 p-0"
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
