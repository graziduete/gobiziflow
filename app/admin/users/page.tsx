"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { UserFilters } from "@/components/admin/user-filters"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  full_name: string | null
  email: string
  role: string
  created_at: string
  is_first_login: boolean
  company_name?: string
}

interface UserFilters {
  search: string
  company: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    company: "all"
  })
  const [filteredUsersState, setFilteredUsersState] = useState<User[]>([])
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Estado para exclusão
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    user: User | null
  }>({
    isOpen: false,
    user: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  // Debounce para busca e recomputo de filtros sem re-render custoso
  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters()
      setCurrentPage(1)
    }, filters.search ? 200 : 0)
    return () => clearTimeout(handler)
  }, [filters, users])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Buscar usuários (payload enxuto)
      const start = (currentPage - 1) * usersPerPage
      const end = start + usersPerPage - 1

      const { data: usersData, error, count } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          created_at,
          is_first_login
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(start, end)

      if (error) throw error

      // Buscar empresas associadas em lote para clientes (evita N+1)
      if (usersData && usersData.length > 0) {
        const clientIds = usersData.filter((u: any) => u.role === 'client').map((u: any) => u.id)
        let companyByUser: Record<string, string | null> = {}
        if (clientIds.length > 0) {
          const { data: ucData } = await supabase
            .from('user_companies')
            .select('user_id, companies(name)')
            .in('user_id', clientIds)

          if (ucData) {
            for (const row of ucData as any[]) {
              companyByUser[row.user_id] = row.companies?.name || null
            }
          }
        }

        const usersWithCompanies = usersData.map((u: any) => ({
          ...u,
          company_name: u.role === 'client' ? (companyByUser[u.id] || null) : null
        }))
        setUsers(usersWithCompanies)
        setTotalCount(count || 0)
      } else {
        setUsers([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
        user.email.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por empresa
    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter(user => 
        user.company_name === filters.company
      )
    }

    setFilteredUsersState(filtered)
  }

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({
      isOpen: true,
      user
    })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.user) return

    try {
      setIsDeleting(true)
      const supabase = createClient()

      // Excluir usuário do banco de dados
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deleteDialog.user.id)

      if (error) throw error

      // Remover da lista local
      setUsers(prevUsers => prevUsers.filter(u => u.id !== deleteDialog.user!.id))
      
      // Fechar diálogo
      setDeleteDialog({ isOpen: false, user: null })

      // Mostrar sucesso
      toast({
        title: "Usuário excluído",
        description: `${deleteDialog.user.full_name || deleteDialog.user.email} foi removido com sucesso.`,
      })

    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir usuário. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, user: null })
  }

  // Cálculos de paginação
  const filteredUsers = useMemo(() => filteredUsersState, [filteredUsersState])
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        {/* Filtros/Ações skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>

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
          <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
            {filters.search ? (
              <span className="ml-2 text-blue-600">
                • {filteredUsers.length} de {users.length} usuários
              </span>
            ) : (
              <span className="ml-2">• {users.length} usuários</span>
            )}
            {totalPages > 1 && (
              <span className="ml-2 text-blue-600">
                • Página {currentPage} de {totalPages}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserFilters 
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(newFilters)}
          />
        <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Link>
        </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {(filters.search || (filters.company && filters.company !== "all")) ? (
              <>
                Usuários filtrados • {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
                {totalPages > 1 && (
                  <span className="ml-2 text-blue-600">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </>
            ) : (
              <>
                Todos os usuários cadastrados no sistema
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
            {currentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.full_name || "Nome não informado"}</h3>
                    <Badge className={
                      user.role === "admin" 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-sm"
                        : user.role === "admin_operacional"
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-sm"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-sm"
                    }>
                      {user.role === "admin" ? "Admin" : user.role === "admin_operacional" ? "Admin Operacional" : "Cliente"}
                    </Badge>
                    {user.is_first_login && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold shadow-sm">Primeiro Login</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.company_name && (
                    <p className="text-xs text-blue-600 font-medium">
                      🏢 {user.company_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                    <Link href={`/admin/users/${user.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border-red-200 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {currentUsers.length === 0 && (
              <div className="text-center py-12">
                {(filters.search || (filters.company && filters.company !== "all")) ? (
                  <div>
                    <p className="text-muted-foreground mb-2">Nenhum usuário encontrado com os filtros aplicados</p>
                    <Button variant="outline" onClick={() => setFilters({
                      search: "",
                      company: "all"
                    })}>
                      Limpar Filtros
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                )}
              </div>
            )}
          </div>

          {/* Paginação */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuários
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

      {/* Diálogo de confirmação de exclusão */}
      <DeleteUserDialog
        isOpen={deleteDialog.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        userName={deleteDialog.user?.full_name || ""}
        userEmail={deleteDialog.user?.email || ""}
        isLoading={isDeleting}
      />
    </div>
  )
}
