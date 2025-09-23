"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ModernGanttFiltersProps {
  companies: any[]
  onFiltersChange: ((filters: any) => void) | null
  defaultCompanyId?: string
}

export function ModernGanttFilters({ companies, onFiltersChange, defaultCompanyId }: ModernGanttFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    company: "all",
    type: "all",
    status: "all",
  })
  const [isMounted, setIsMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true)
    if (defaultCompanyId) {
      setFilters(prev => ({ ...prev, company: defaultCompanyId }))
    }
  }, [defaultCompanyId])

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

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

  const updateFilters = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Count active filters (exclude search if empty and exclude "all" values)
    const activeCount = Object.entries(newFilters).filter(([k, v]) => {
      if (k === 'search') return v && v.trim() !== ''
      return v !== "all"
    }).length
    setActiveFiltersCount(activeCount)

    // Only call onFiltersChange if it exists (not null)
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      company: defaultCompanyId || "all", // Manter a empresa padrão se definida
      type: "all",
      status: "all",
    }
    setFilters(clearedFilters)
    setActiveFiltersCount(0)
    
    // Only call onFiltersChange if it exists (not null)
    if (onFiltersChange) {
      onFiltersChange(clearedFilters)
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-600 text-white">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filtros do Cronograma</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filtrar projetos na visão Gantt</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo
                  {activeFiltersCount > 1 ? "s" : ""}
                </Badge>
              )}

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Primeira linha - Buscar (linha inteira) */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar projeto..."
                value={filters.search}
                onChange={(e) => updateFilters("search", e.target.value)}
                className="pl-12 h-10 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Segunda linha - Empresa, Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Company */}
            <Select value={filters.company} onValueChange={(value) => updateFilters("company", value)}>
              <SelectTrigger className="w-full h-12 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={filters.type} onValueChange={(value) => updateFilters("type", value)}>
              <SelectTrigger className="w-full h-12 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {projectTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={filters.status} onValueChange={(value) => updateFilters("status", value)}>
              <SelectTrigger className="w-full h-12 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
