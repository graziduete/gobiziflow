"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface Company {
  id: string
  name: string
  description?: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  created_at: string
  has_hour_package?: boolean
  contracted_hours?: number
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(10)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          description,
          logo_url,
          contact_email,
          contact_phone,
          website,
          created_at,
          has_hour_package,
          contracted_hours
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCompanies(data || [])
    } catch (error) {
      console.error("Erro ao buscar empresas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cálculos de paginação
  const totalPages = Math.ceil(companies.length / companiesPerPage)
  const startIndex = (currentPage - 1) * companiesPerPage
  const endIndex = startIndex + companiesPerPage
  const currentCompanies = companies.slice(startIndex, endIndex)

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)
  const goToLastPage = () => goToPage(totalPages)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          <h2 className="text-3xl font-bold tracking-tight">Empresas</h2>
          <p className="text-muted-foreground">
            {companies.length > 0 ? (
              <>
                {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''} no sistema
                {totalPages > 1 && (
                  <span className="ml-2 text-blue-600">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </>
            ) : (
              "Gerencie as empresas cadastradas no sistema"
            )}
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            {companies.length > 0 ? (
              <>
                Mostrando {startIndex + 1} a {Math.min(endIndex, companies.length)} de {companies.length} empresas
                {totalPages > 1 && (
                  <span className="ml-2 text-blue-600">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </>
            ) : (
              "Nenhuma empresa cadastrada"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentCompanies.map((company) => (
              <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-4 flex-1">
                  {/* Logo da empresa */}
                  <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={`Logo ${company.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">
                        Sem logo
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{company.name}</h3>
                      {company.has_hour_package && (
                        <Badge variant="secondary" className="text-xs">
                          Pacote de Horas
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{company.description || "Sem descrição"}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {company.contact_email && <span>Email: {company.contact_email}</span>}
                      {company.contact_phone && <span>Telefone: {company.contact_phone}</span>}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Website
                        </a>
                      )}
                      {company.has_hour_package && company.contracted_hours && (
                        <span className="text-blue-600 font-medium">
                          {company.contracted_hours} horas contratadas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cadastrada em: {new Date(company.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                    <Link href={`/admin/companies/${company.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                    Ver Projetos
                  </Button>
                </div>
              </div>
            ))}
            
            {currentCompanies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, companies.length)} de {companies.length} empresas
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
