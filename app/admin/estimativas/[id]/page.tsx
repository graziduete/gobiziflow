"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share,
  Calculator,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  FileText,
  Calendar
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { toast } from "sonner"

interface Estimativa {
  id: string
  nome_projeto: string
  meses_previstos: number
  status: string
  percentual_imposto: number
  observacoes: string
  total_estimado: number
  total_com_impostos: number
  created_at: string
  updated_at: string
}

interface RecursoEstimativa {
  id: string
  nome_recurso: string
  taxa_hora: number
  total_horas: number
  total_custo: number
  ordem: number
  alocacoes: { semana: number; horas: number; custo_semanal: number }[]
}

const statusConfig = {
  proposta_comercial: { label: "Proposta Comercial", variant: "default" as const },
  em_aprovacao: { label: "Em Aprovação", variant: "secondary" as const },
  aprovada: { label: "Aprovada", variant: "default" as const },
  rejeitada: { label: "Rejeitada", variant: "destructive" as const },
  convertida_projeto: { label: "Convertida em Projeto", variant: "outline" as const },
}

export default function VisualizarEstimativaPage() {
  const router = useRouter()
  const params = useParams()
  const estimativaId = params.id as string
  const supabase = createClient()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  const [estimativa, setEstimativa] = useState<Estimativa | null>(null)
  const [recursos, setRecursos] = useState<RecursoEstimativa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (estimativaId) {
      fetchEstimativa()
    }
  }, [estimativaId])

  const fetchEstimativa = async () => {
    try {
      setLoading(true)

      // Buscar estimativa
      const { data: estimativaData, error: estimativaError } = await supabase
        .from('estimativas')
        .select('*')
        .eq('id', estimativaId)
        .single()

      if (estimativaError) throw estimativaError
      setEstimativa(estimativaData)

      // Buscar recursos
      const { data: recursosData, error: recursosError } = await supabase
        .from('recursos_estimativa')
        .select('*')
        .eq('estimativa_id', estimativaId)
        .order('ordem')

      if (recursosError) throw recursosError

      // Buscar alocações para cada recurso
      const recursosComAlocacoes = await Promise.all(
        (recursosData || []).map(async (recurso) => {
          const { data: alocacoesData, error: alocacoesError } = await supabase
            .from('alocacao_semanal')
            .select('*')
            .eq('recurso_id', recurso.id)
            .order('semana')

          if (alocacoesError) throw alocacoesError

          return {
            ...recurso,
            alocacoes: alocacoesData || []
          }
        })
      )

      setRecursos(recursosComAlocacoes)
    } catch (error) {
      console.error('Erro ao buscar estimativa:', error)
      toast.error('Erro ao carregar estimativa')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
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
            .eq('id', estimativaId)

          if (error) throw error

          toast.success('Estimativa excluída com sucesso')
          router.push('/admin/estimativas')
        } catch (error) {
          console.error('Erro ao excluir estimativa:', error)
          toast.error('Erro ao excluir estimativa')
        }
      }
    })
  }

  const handleConvertToProject = async () => {
    // TODO: Implementar conversão para projeto
    toast.info('Funcionalidade de conversão será implementada em breve')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!estimativa) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estimativa não encontrada</h1>
            <p className="text-muted-foreground">
              A estimativa solicitada não foi encontrada
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Estimativa não encontrada</h3>
            <p className="text-muted-foreground mb-4">
              A estimativa que você está procurando não existe ou foi removida.
            </p>
            <Button onClick={() => router.push('/admin/estimativas')}>
              Voltar para Estimativas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const semanas = Array.from({ length: estimativa.meses_previstos * 4 }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{estimativa.nome_projeto}</h1>
              <Badge variant={statusConfig[estimativa.status as keyof typeof statusConfig]?.variant || "default"}>
                {statusConfig[estimativa.status as keyof typeof statusConfig]?.label || estimativa.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criado em {formatDate(estimativa.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/estimativas/${estimativaId}/editar`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {estimativa.status === 'aprovada' && (
            <Button size="sm" onClick={handleConvertToProject}>
              <FileText className="h-4 w-4 mr-2" />
              Converter em Projeto
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duração</label>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {estimativa.meses_previstos} meses
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impostos</label>
                  <p className="text-lg font-semibold">{estimativa.percentual_imposto}%</p>
                </div>
              </div>
              {estimativa.observacoes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{estimativa.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recursos e Alocações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recursos e Alocações
              </CardTitle>
              <CardDescription>
                Distribuição de horas por recurso e semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recursos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum recurso encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recursos.map((recurso) => (
                    <Card key={recurso.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{recurso.nome_recurso}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(recurso.taxa_hora)}/hora
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{recurso.total_horas.toFixed(1)}h</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(recurso.total_custo)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-8 gap-1 text-xs">
                          <div className="text-center font-medium text-muted-foreground">Semana</div>
                          {semanas.slice(0, 7).map((semana) => (
                            <div key={semana} className="text-center font-medium text-muted-foreground">
                              S{semana}
                            </div>
                          ))}
                          <div className="text-center font-medium text-muted-foreground">Total</div>
                          
                          <div className="text-center font-medium">Horas</div>
                          {semanas.slice(0, 7).map((semana) => {
                            const alocacao = recurso.alocacoes.find(a => a.semana === semana)
                            return (
                              <div key={semana} className="text-center p-1 bg-muted rounded">
                                {alocacao?.horas || 0}
                              </div>
                            )
                          })}
                          <div className="text-center font-semibold p-1 bg-primary/10 rounded">
                            {recurso.total_horas.toFixed(1)}
                          </div>
                          
                          <div className="text-center font-medium">Custo</div>
                          {semanas.slice(0, 7).map((semana) => {
                            const alocacao = recurso.alocacoes.find(a => a.semana === semana)
                            return (
                              <div key={semana} className="text-center p-1 bg-muted rounded text-xs">
                                {alocacao?.custo_semanal ? formatCurrency(alocacao.custo_semanal) : 'R$ 0,00'}
                              </div>
                            )
                          })}
                          <div className="text-center font-semibold p-1 bg-primary/10 rounded">
                            {formatCurrency(recurso.total_custo)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(estimativa.total_estimado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Impostos ({estimativa.percentual_imposto}%):</span>
                  <span>
                    {formatCurrency(estimativa.total_estimado * estimativa.percentual_imposto / 100)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {formatCurrency(estimativa.total_com_impostos)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total de Recursos:</span>
                <span className="font-medium">{recursos.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total de Horas:</span>
                <span className="font-medium">
                  {recursos.reduce((sum, r) => sum + r.total_horas, 0).toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duração:</span>
                <span className="font-medium">{estimativa.meses_previstos} meses</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Horas por Mês:</span>
                <span className="font-medium">
                  {(recursos.reduce((sum, r) => sum + r.total_horas, 0) / estimativa.meses_previstos).toFixed(1)}h
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {ConfirmationDialog}
    </div>
  )
}
