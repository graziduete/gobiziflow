"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Calculator, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  User
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Estimativa {
  id: string
  nome_projeto: string
  meses_previstos: number
  status: string
  total_estimado: number
  total_com_impostos: number
  created_at: string
  updated_at: string
  tipo?: string
  total_tarefas?: number
  ajustada_por_admin?: boolean
  profiles?: {
    full_name: string
    email: string
    role: string
  }
}

const statusConfig = {
  proposta_comercial: { label: "Proposta Comercial", variant: "default" as const },
  em_aprovacao: { label: "Em Aprovação", variant: "secondary" as const },
  aprovada: { label: "Aprovada", variant: "default" as const },
  rejeitada: { label: "Rejeitada", variant: "destructive" as const },
  convertida_projeto: { label: "Convertida em Projeto", variant: "outline" as const },
}

export default function EstimativasPage() {
  const [estimativas, setEstimativas] = useState<Estimativa[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEstimativaModal, setShowNewEstimativaModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filters, setFilters] = useState({
    nome: "",
    tipo: "todos" // "todos", "recurso", "tarefa"
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  
  const router = useRouter()
  const supabase = createClient()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    fetchUserRole()
  }, [])

  useEffect(() => {
    if (userRole) {
      fetchEstimativas()
    }
  }, [currentPage, userRole])

  const fetchUserRole = async () => {
    try {
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

  const fetchEstimativas = async () => {
    try {
      setLoading(true)
      console.log('Buscando estimativas...', { userRole })
      
      // Calcular offset para paginação
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      // Construir query baseada no perfil do usuário
      let estimativasQuery = supabase
        .from('estimativas')
        .select('*')
        .order('created_at', { ascending: false })
      
      let countQuery = supabase
        .from('estimativas')
        .select('*', { count: 'exact', head: true })
      
      // Se for admin_operacional, filtrar apenas estimativas criadas por admin_operacional
      if (userRole === 'admin_operacional') {
        // Buscar IDs de usuários com perfil admin_operacional
        const { data: adminOperacionalUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin_operacional')
        
        const adminOperacionalIds = adminOperacionalUsers?.map(u => u.id) || []
        
        if (adminOperacionalIds.length > 0) {
          estimativasQuery = estimativasQuery.in('created_by', adminOperacionalIds)
          countQuery = countQuery.in('created_by', adminOperacionalIds)
        } else {
          // Se não há usuários admin_operacional, não mostrar nenhuma estimativa
          estimativasQuery = estimativasQuery.eq('created_by', '00000000-0000-0000-0000-000000000000')
          countQuery = countQuery.eq('created_by', '00000000-0000-0000-0000-000000000000')
        }
      }
      
      // Buscar total de estimativas para paginação
      const { count: totalCount, error: countError } = await countQuery

      if (countError) {
        console.error('Erro ao contar estimativas:', countError)
        throw countError
      }

      setTotalCount(totalCount || 0)
      setTotalPages(Math.ceil((totalCount || 0) / itemsPerPage))
      
      // Buscar estimativas com paginação
      const { data: estimativasData, error: estimativasError } = await estimativasQuery
        .range(from, to)

      if (estimativasError) {
        console.error('Erro ao buscar estimativas:', estimativasError)
        throw estimativasError
      }

      console.log('Estimativas encontradas:', estimativasData?.length || 0)

      // Buscar dados dos usuários criadores e contagem de tarefas
      if (estimativasData && estimativasData.length > 0) {
        const userIds = [...new Set(estimativasData.map(est => est.created_by))]
        
        // Buscar profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', userIds)

        if (profilesError) {
          console.error('Erro ao buscar profiles:', profilesError)
          // Continuar mesmo com erro nos profiles
        }

        // Buscar contagem de tarefas e recalcular valores para estimativas do tipo 'tarefa'
        const estimativasTarefa = estimativasData.filter(est => est.tipo === 'tarefa')
        let tarefasCount: { [key: string]: number } = {}
        let valoresRecalculados: { [key: string]: { total_estimado: number, total_com_impostos: number } } = {}
        
        if (estimativasTarefa.length > 0) {
          // Buscar tarefas e recalcular valores uma por uma
          for (const estimativa of estimativasTarefa) {
            const { data: tarefasData, error: tarefasError } = await supabase
              .from('tarefas_estimativa')
              .select('total_base, total_com_gordura')
              .eq('estimativa_id', estimativa.id)

            if (!tarefasError && tarefasData) {
              tarefasCount[estimativa.id] = tarefasData.length
              
              // Recalcular valores em tempo real (mesma lógica da página de visualizar)
              const totalBase = tarefasData.reduce((total, tarefa) => total + tarefa.total_base, 0)
              const totalComGordura = tarefasData.reduce((total, tarefa) => total + tarefa.total_com_gordura, 0)
              const totalHoras = Math.round(totalComGordura * 10) / 10
              const totalEstimado = Math.round((totalHoras * estimativa.valor_hora) * 100) / 100
              const impostos = Math.round((totalEstimado * estimativa.percentual_imposto / 100) * 100) / 100
              const totalComImpostos = Math.round((totalEstimado + impostos) * 100) / 100
              
              valoresRecalculados[estimativa.id] = {
                total_estimado: totalEstimado,
                total_com_impostos: totalComImpostos
              }
            } else {
              tarefasCount[estimativa.id] = 0
            }
          }
        }

        // Combinar dados
        const estimativasComProfiles = estimativasData.map(estimativa => {
          const baseEstimativa = {
            ...estimativa,
            profiles: profilesData?.find(profile => profile.id === estimativa.created_by),
            total_tarefas: estimativa.tipo === 'tarefa' ? (tarefasCount[estimativa.id] || 0) : undefined
          }
          
          // Para estimativas por tarefa, usar valores recalculados em tempo real
          if (estimativa.tipo === 'tarefa' && valoresRecalculados[estimativa.id]) {
            return {
              ...baseEstimativa,
              total_estimado: valoresRecalculados[estimativa.id].total_estimado,
              total_com_impostos: valoresRecalculados[estimativa.id].total_com_impostos
            }
          }
          
          return baseEstimativa
        })

        
        setEstimativas(estimativasComProfiles)
      } else {
        setEstimativas([])
      }
    } catch (error) {
      console.error('Erro ao buscar estimativas:', error)
      toast.error('Erro ao carregar estimativas')
    } finally {
      setLoading(false)
    }
  }

  // Funções de navegação da paginação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Aplicar filtros
  const filteredEstimativas = estimativas.filter(estimativa => {
    const matchesNome = !filters.nome || 
      estimativa.nome_projeto.toLowerCase().includes(filters.nome.toLowerCase())
    
    const matchesTipo = filters.tipo === "todos" || 
      (filters.tipo === "recurso" && (!estimativa.tipo || estimativa.tipo !== "tarefa")) ||
      (filters.tipo === "tarefa" && estimativa.tipo === "tarefa")
    
    return matchesNome && matchesTipo
  })

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({ nome: "", tipo: "todos" })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleDeleteEstimativa = async (id: string) => {
    showConfirmation({
      title: "Excluir Estimativa",
      description: "Tem certeza que deseja excluir esta estimativa? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('estimativas')
            .delete()
            .eq('id', id)

          if (error) throw error

          toast.success('Estimativa excluída com sucesso')
          fetchEstimativas()
        } catch (error) {
          console.error('Erro ao excluir estimativa:', error)
          toast.error('Erro ao excluir estimativa')
        }
      }
    })
  }

  const handleConvertToProject = async (estimativa: Estimativa) => {
    // TODO: Implementar conversão para projeto
    toast.info('Funcionalidade de conversão será implementada em breve')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimativas</h1>
          <p className="text-muted-foreground">
            Gerencie estimativas de projetos e recursos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {(filters.nome || filters.tipo !== 'todos') && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {[filters.nome && 'Nome', filters.tipo !== 'todos' && 'Tipo'].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Dialog open={showNewEstimativaModal} onOpenChange={setShowNewEstimativaModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Estimativa
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Estimativa</DialogTitle>
              <DialogDescription>
                Escolha o tipo de estimativa que deseja criar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Opção Por Recurso - apenas para admin */}
              {userRole !== 'admin_operacional' && (
                <Button 
                  className="w-full justify-start gap-3 h-16"
                  variant="outline"
                  onClick={() => {
                    setShowNewEstimativaModal(false)
                    router.push('/admin/estimativas/nova?tipo=recurso')
                  }}
                >
                  <Calculator className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-medium">Por Recurso</div>
                    <div className="text-sm text-muted-foreground">
                      Aloque recursos e horas por semana
                    </div>
                  </div>
                </Button>
              )}
              
              {/* Opção Por Tarefa - sempre disponível */}
              <Button 
                className="w-full justify-start gap-3 h-16"
                variant="outline"
                onClick={() => {
                  setShowNewEstimativaModal(false)
                  router.push('/admin/estimativas/nova-tarefa')
                }}
              >
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Por Tarefa</div>
                  <div className="text-sm text-muted-foreground">
                    Estime baseado em tarefas específicas
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards - Só renderizar quando soubermos o perfil do usuário */}
      {userRole && (
        <div className={`grid gap-4 ${userRole === 'admin_operacional' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estimativas</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimativas.length}</div>
              <p className="text-xs text-muted-foreground">
                {estimativas.filter(e => e.status === 'proposta_comercial').length} em proposta
              </p>
            </CardContent>
          </Card>
          
          {/* Cards financeiros apenas para admin */}
          {userRole !== 'admin_operacional' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Estimado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(estimativas.reduce((sum, e) => sum + e.total_com_impostos, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Com impostos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impostos a Pagar</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(estimativas.reduce((sum, e) => sum + (e.total_com_impostos - e.total_estimado), 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total de impostos
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Convertidos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estimativas.filter(e => e.status === 'convertida_projeto').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimativas aprovadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Estimativas List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEstimativas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {(filters.nome || filters.tipo !== 'todos') ? 'Nenhuma estimativa encontrada' : 'Nenhuma estimativa criada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {(filters.nome || filters.tipo !== 'todos')
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira estimativa de projeto'
                }
              </p>
              {!(filters.nome || filters.tipo !== 'todos') && (
                <Button onClick={() => setShowNewEstimativaModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Estimativa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEstimativas.map((estimativa) => (
            <Card key={estimativa.id} className={`hover:shadow-md transition-shadow ${
              userRole === 'admin' && estimativa.profiles?.role === 'admin_operacional' 
                ? estimativa.ajustada_por_admin 
                  ? 'border-l-4 border-l-green-400 bg-green-50/30'
                  : 'border-l-4 border-l-orange-400 bg-orange-50/30'
                : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{estimativa.nome_projeto}</h3>
                      <Badge 
                        variant="outline" 
                        className={estimativa.tipo === 'tarefa' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {estimativa.tipo === 'tarefa' ? 'Por Tarefa' : 'Por Recurso'}
                      </Badge>
                      <Badge variant={statusConfig[estimativa.status as keyof typeof statusConfig]?.variant || "default"}>
                        {statusConfig[estimativa.status as keyof typeof statusConfig]?.label || estimativa.status}
                      </Badge>
                      {/* Badge "Nova" para estimativas criadas por admin_operacional que precisam de ajustes */}
                      {userRole === 'admin' && estimativa.profiles?.role === 'admin_operacional' && !estimativa.ajustada_por_admin && (
                        <Badge 
                          variant="outline" 
                          className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse"
                        >
                          Nova
                        </Badge>
                      )}
                      {/* Badge "Ajustada" para estimativas que foram ajustadas pelo admin */}
                      {userRole === 'admin' && estimativa.profiles?.role === 'admin_operacional' && estimativa.ajustada_por_admin && (
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Ajustada
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {estimativa.tipo === 'tarefa' ? (
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {estimativa.total_tarefas || 0} tarefas
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {estimativa.meses_previstos} meses
                        </span>
                      )}
                      {/* Valor monetário apenas para admin */}
                      {userRole !== 'admin_operacional' && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(estimativa.total_com_impostos)}
                        </span>
                      )}
                      <span>
                        Criado em {formatDate(estimativa.created_at)}
                      </span>
                      {estimativa.profiles?.full_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {estimativa.profiles.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(estimativa.tipo === 'tarefa' ? `/admin/estimativas/${estimativa.id}/tarefa` : `/admin/estimativas/${estimativa.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(estimativa.tipo === 'tarefa' ? `/admin/estimativas/${estimativa.id}/editar-tarefa` : `/admin/estimativas/${estimativa.id}/editar`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {estimativa.status === 'aprovada' && (
                        <DropdownMenuItem onClick={() => handleConvertToProject(estimativa)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Converter em Projeto
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEstimativa(estimativa.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} estimativas
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
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
              Próxima
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal de Filtros */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros de Estimativas</DialogTitle>
            <DialogDescription>
              Filtre as estimativas por nome e tipo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                placeholder="Digite o nome do projeto..."
                value={filters.nome}
                onChange={(e) => handleFilterChange('nome', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Estimativa</label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os tipos</option>
                <option value="recurso">Por Recurso</option>
                <option value="tarefa">Por Tarefa</option>
              </select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button onClick={() => setShowFiltersModal(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      {ConfirmationDialog}
    </div>
  )
}
