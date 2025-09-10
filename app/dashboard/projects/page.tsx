"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from "lucide-react"
import Link from "next/link"
import { useClientData } from "@/hooks/use-client-data"
import { ProjectsLoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  project_type: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  created_at: string
  company_id: string
}

interface ProjectFilters {
  status: string
  priority: string
  search: string
}

export default function ClientProjectsPage() {
  const { projects, company, isLoading, error } = useClientData()
  const [filters, setFilters] = useState<ProjectFilters>({
    status: "all",
    priority: "all",
    search: ""
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [projectsPerPage] = useState(10)

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status !== "all") count++
    if (filters.priority !== "all") count++
    if (filters.search.trim()) count++
    return count
  }, [filters])

  // Memoizar projetos filtrados para evitar recálculos desnecessários
  const filteredProjects = useMemo(() => {
    let filtered = [...projects]

    // Filtro por status
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(project => project.status === filters.status)
    }

    // Filtro por prioridade
    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter(project => project.priority === filters.priority)
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      )
    }

    // Ordenar por data de início ascendente; nulos por último
    filtered.sort((a, b) => {
      const ad = a?.start_date ? new Date(a.start_date).getTime() : Infinity
      const bd = b?.start_date ? new Date(b.start_date).getTime() : Infinity
      return ad - bd
    })
    return filtered
  }, [projects, filters])

  useEffect(() => {
    setCurrentPage(1) // Reset para primeira página quando filtros mudam
  }, [filters])

  // Cálculos de paginação memoizados
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
    const startIndex = (currentPage - 1) * projectsPerPage
    const endIndex = startIndex + projectsPerPage
    const currentProjects = filteredProjects.slice(startIndex, endIndex)
    
    return { totalPages, startIndex, endIndex, currentProjects }
  }, [filteredProjects, currentPage, projectsPerPage])

  const { totalPages, startIndex, endIndex, currentProjects } = paginationData

  // Funções de navegação otimizadas com useCallback
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage])
  const goToLastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages])
  const goToPreviousPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage])
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage])

  // Funções de formatação memoizadas
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "homologation":
        return "bg-purple-100 text-purple-800"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800"
      case "delayed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
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
      default:
        return "Planejamento"
    }
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
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
  }, [])

  const getPriorityText = useCallback((priority: string) => {
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
  }, [])

  const getProjectTypeText = useCallback((projectType: string | null) => {
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
  }, [])

  const getProjectTypeColor = useCallback((projectType: string | null) => {
    if (!projectType) return "bg-gray-100 text-gray-800"
    
    switch (projectType) {
      case "automation":
        return "bg-purple-100 text-purple-800"
      case "data_analytics":
        return "bg-blue-100 text-blue-800"
      case "digital_development":
        return "bg-green-100 text-green-800"
      case "design":
        return "bg-pink-100 text-pink-800"
      case "consulting":
        return "bg-indigo-100 text-indigo-800"
      case "project_management":
        return "bg-orange-100 text-orange-800"
      case "system_integration":
        return "bg-teal-100 text-teal-800"
      case "infrastructure":
        return "bg-cyan-100 text-cyan-800"
      case "support":
        return "bg-yellow-100 text-yellow-800"
      case "training":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])

  if (isLoading) {
    return <ProjectsLoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
          <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
          <p className="text-muted-foreground">
            Projetos da empresa {company?.name || "Carregando..."}
            {(filters.status !== "all" || filters.priority !== "all" || filters.search) ? (
              <span className="ml-2 text-blue-600">
                • {filteredProjects.length} de {projects.length} projetos
              </span>
            ) : (
              <span className="ml-2">• {projects.length} projetos</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 relative"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Filtros */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-cyan-600" />
              Filtros de Busca
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Buscar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do projeto..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="homologation">Homologação</SelectItem>
                    <SelectItem value="on_hold">Pausado</SelectItem>
                    <SelectItem value="delayed">Atrasado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Prioridade */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Prioridade</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setFilters({ status: "all", priority: "all", search: "" })}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={() => setShowFilters(false)}>Aplicar Filtros</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
          <CardDescription>
            {(filters.status !== "all" || filters.priority !== "all" || filters.search) ? (
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
                Todos os projetos da sua empresa
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
          <div className="space-y-4">
            {currentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                    <Badge className={getPriorityColor(project.priority)}>{getPriorityText(project.priority)}</Badge>
                    <Badge className={getProjectTypeColor(project.project_type)}>{getProjectTypeText(project.project_type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.description || "Sem descrição"}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Empresa: {company?.name || "Carregando..."}</span>
                    {project.budget && <span>Orçamento: R$ {Number(project.budget).toLocaleString("pt-BR")}</span>}
                    {project.start_date && (
                      <span>Início: {new Date(project.start_date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</span>
                    )}
                    {project.end_date && <span>Término: {new Date(project.end_date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Cronograma
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {currentProjects.length === 0 && (
              <div className="text-center py-12">
                {(filters.status !== "all" || filters.priority !== "all" || filters.search) ? (
                  <div>
                    <p className="text-muted-foreground mb-2">Nenhum projeto encontrado com os filtros aplicados</p>
                    <Button variant="outline" onClick={() => setFilters({
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
          </div>

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
