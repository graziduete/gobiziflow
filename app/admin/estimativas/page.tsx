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
  DollarSign
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewEstimativaModal, setShowNewEstimativaModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchEstimativas()
  }, [])

  const fetchEstimativas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('estimativas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEstimativas(data || [])
    } catch (error) {
      console.error('Erro ao buscar estimativas:', error)
      toast.error('Erro ao carregar estimativas')
    } finally {
      setLoading(false)
    }
  }

  const filteredEstimativas = estimativas.filter(estimativa =>
    estimativa.nome_projeto.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    if (!confirm('Tem certeza que deseja excluir esta estimativa?')) return

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
              <Button 
                className="w-full justify-start gap-3 h-16"
                variant="outline"
                onClick={() => {
                  setShowNewEstimativaModal(false)
                  router.push('/admin/estimativas/nova?tipo=tarefa')
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(estimativas.reduce((sum, e) => sum + e.total_estimado, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem impostos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor com Impostos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(estimativas.reduce((sum, e) => sum + e.total_com_impostos, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total final
            </p>
          </CardContent>
        </Card>
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

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar estimativas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

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
                {searchTerm ? 'Nenhuma estimativa encontrada' : 'Nenhuma estimativa criada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira estimativa de projeto'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNewEstimativaModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Estimativa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEstimativas.map((estimativa) => (
            <Card key={estimativa.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{estimativa.nome_projeto}</h3>
                      <Badge variant={statusConfig[estimativa.status as keyof typeof statusConfig]?.variant || "default"}>
                        {statusConfig[estimativa.status as keyof typeof statusConfig]?.label || estimativa.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {estimativa.meses_previstos} meses
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(estimativa.total_com_impostos)}
                      </span>
                      <span>
                        Criado em {formatDate(estimativa.created_at)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/estimativas/${estimativa.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/estimativas/${estimativa.id}/editar`)}>
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
    </div>
  )
}
