"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, Search, X } from "lucide-react"

interface ProjectFiltersProps {
  companies: any[]
  users?: any[]
  filters: any
  onFiltersChange: (filters: any) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectFilters({ companies, users, filters: externalFilters, onFiltersChange, isOpen, onOpenChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState({
    company_id: externalFilters?.company_id || "all",
    priority: externalFilters?.priority || "all", 
    status: externalFilters?.status || "all",
    category: externalFilters?.category || "all",
    search: externalFilters?.search || "",
  })

  // Sincronizar filtros externos com internos
  useEffect(() => {
    if (externalFilters) {
      setFilters({
        company_id: externalFilters.company_id || "all",
        priority: externalFilters.priority || "all",
        status: externalFilters.status || "all",
        category: externalFilters.category || "all",
        search: externalFilters.search || "",
      })
    }
  }, [externalFilters])

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

  const projectStatuses = [
    { value: "planning", label: "Planejamento" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "homologation", label: "Homologação" },
    { value: "on_hold", label: "Pausado" },
    { value: "delayed", label: "Atrasado" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" }
  ]

  const projectPriorities = [
    { value: "low", label: "Baixa" },
    { value: "medium", label: "Média" },
    { value: "high", label: "Alta" },
    { value: "urgent", label: "Urgente" }
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    // Atualiza apenas o estado local. A busca só acontece ao clicar em "Aplicar Filtros".
    setFilters(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      company_id: "all",
      priority: "all",
      status: "all",
      category: "all",
      search: "",
    }
    setFilters(clearedFilters)
    // Limpa e fecha a modal; a listagem será atualizada sem reabrir
    onFiltersChange(clearedFilters)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl !z-[9998] bg-white shadow-2xl max-h-[90vh] overflow-y-auto p-10"
        style={{ zIndex: 9998 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-cyan-600" />
            Filtros de Busca
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-10">
          {/* Primeira linha - Buscar (linha inteira) */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '16px', width: '16px', color: '#9CA3AF' }} />
              <Input
                placeholder="Nome do projeto..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          {/* Segunda linha - Empresa, Prioridade e Status */}
          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Empresa</label>
              <Select value={filters.company_id} onValueChange={(value) => handleFilterChange("company_id", value)}>
                <SelectTrigger style={{ width: '100%' }}>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent 
                  className="!z-[9999]" 
                  position="popper"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Prioridade</label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger style={{ width: '100%' }}>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent 
                  className="!z-[9999]" 
                  position="popper"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  {projectPriorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger style={{ width: '100%' }}>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent 
                  className="!z-[9999]" 
                  position="popper"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="all">Todos os status</SelectItem>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Categoria</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger style={{ width: '100%' }}>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent 
                  className="!z-[9999]" 
                  position="popper"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="project">Projeto</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', paddingTop: '32px' }}>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            onClick={() => {
              onFiltersChange(filters)
              onOpenChange(false)
            }}
          >
            Aplicar Filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
