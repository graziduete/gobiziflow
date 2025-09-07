"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Filter, X, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserFilters {
  search: string
  company: string
}

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  // Buscar empresas
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("companies")
          .select("id, name")
          .order("name")
        
        if (error) throw error
        setCompanies(data || [])
      } catch (error) {
        console.error("Erro ao buscar empresas:", error)
      }
    }

    fetchCompanies()
  }, [])

  // Contar quantos filtros estão aplicados
  const activeFiltersCount = Object.values(filters).filter(value => value !== "" && value !== "all").length

  const handleFilterChange = (field: keyof UserFilters, value: string) => {
    const newFilters = { ...localFilters, [field]: value }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      company: "all"
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Usuários
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Busca por texto */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar por nome ou e-mail</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Digite para buscar..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select
              value={localFilters.company}
              onValueChange={(value) => handleFilterChange("company", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.name}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros ativos */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Filtros ativos:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: "{filters.search}"
                    <button
                      onClick={() => onFiltersChange({ ...filters, search: "" })}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.company && filters.company !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Empresa: {filters.company}
                    <button
                      onClick={() => onFiltersChange({ ...filters, company: "all" })}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Todos
            </Button>
            <Button onClick={applyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 