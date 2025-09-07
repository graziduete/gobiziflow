"use client"

import { useState, useEffect } from "react"
import { TrendingUp } from "lucide-react"
import { ModernGanttFilters } from "@/components/admin/modern-gantt-filters"
import { GanttView } from "@/components/admin/gantt-view"

interface ClientDashboardFiltersProps {
  projects: any[]
  companies: any[]
  defaultCompanyId: string
  onProjectsChange: (projects: any[]) => void
}

export function ClientDashboardFilters({ projects, companies, defaultCompanyId, onProjectsChange }: ClientDashboardFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    company: defaultCompanyId,
    type: "all",
    status: "all",
  })

  // Função para aplicar filtros
  const applyFilters = (newFilters: any) => {
    setFilters(newFilters)
    
    let filtered = [...projects]

    // Filtro por busca
    if (newFilters.search && newFilters.search.trim() !== "") {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(newFilters.search.toLowerCase())
      )
    }

    // Filtro por empresa
    if (newFilters.company && newFilters.company !== "all") {
      filtered = filtered.filter(project => project.company_id === newFilters.company)
    }

    // Filtro por tipo
    if (newFilters.type && newFilters.type !== "all") {
      filtered = filtered.filter(project => project.project_type === newFilters.type)
    }

    // Filtro por status
    if (newFilters.status && newFilters.status !== "all") {
      filtered = filtered.filter(project => project.status === newFilters.status)
    }

    onProjectsChange(filtered)
  }

  // Aplicar filtros iniciais
  useEffect(() => {
    applyFilters(filters)
  }, [projects])

  return (
    <ModernGanttFilters 
      companies={companies}
      onFiltersChange={applyFilters}
      defaultCompanyId={defaultCompanyId}
    />
  )
}