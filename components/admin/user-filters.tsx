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

  // Buscar empresas com filtro baseado no role
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const supabase = createClient()
        
        // Verificar usuário logado e seu perfil
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('🔍 [UserFilters] Usuário não autenticado')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_client_admin')
          .eq('id', user.id)
          .single()

        console.log('🔍 [UserFilters] Perfil do usuário:', profile)

        let query = supabase.from('companies').select('id, name, tenant_id').order('name')

        // Verificar se é Client Admin
        const { data: isClientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (isClientAdmin) {
          console.log('🏢 [UserFilters] Client Admin detectado, filtrando empresas por tenant:', isClientAdmin.company_id)
          query = query.eq('tenant_id', isClientAdmin.company_id)
        } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
          console.log('👤 [UserFilters] Admin Normal/Operacional detectado, filtrando empresas sem tenant_id')
          query = query.is('tenant_id', null)
        } else {
          console.log('👑 [UserFilters] Admin Master detectado, sem filtro de empresas')
        }

        const { data, error } = await query
        
        if (error) throw error
        console.log('✅ [UserFilters] Empresas encontradas para filtro:', data)
        setCompanies(data || [])
      } catch (error) {
        console.error("❌ [UserFilters] Erro ao buscar empresas:", error)
        setCompanies([])
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