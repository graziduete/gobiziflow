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
  Calendar,
  User
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useEstimativaDownload } from "@/hooks/use-estimativa-download"
import { ShareModal } from "@/components/ui/share-modal"
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
  profiles?: {
    full_name: string
    email: string
  }
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
  proposta_comercial: { 
    label: "Proposta Comercial", 
    variant: "default" as const,
    className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-sm"
  },
  em_aprovacao: { 
    label: "Em Aprovação", 
    variant: "secondary" as const,
    className: "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold shadow-sm"
  },
  aprovada: { 
    label: "Aprovada", 
    variant: "default" as const,
    className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-sm"
  },
  rejeitada: { 
    label: "Rejeitada", 
    variant: "destructive" as const,
    className: "bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-sm"
  },
  convertida_projeto: { 
    label: "Convertida em Projeto", 
    variant: "outline" as const,
    className: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-sm"
  },
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
  const [generatingLink, setGeneratingLink] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  
  const { downloadEstimativaPDF } = useEstimativaDownload()

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

      // Buscar dados do usuário criador
      if (estimativaData?.created_by) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', estimativaData.created_by)
          .single()

        setEstimativa({
          ...estimativaData,
          profiles: profileData
        })
      } else {
        setEstimativa(estimativaData)
      }

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

  const handleDownloadPDF = async () => {
    if (!estimativa) return
    
    try {
      setGeneratingPDF(true)
      const result = await downloadEstimativaPDF(estimativa, recursos, {
        filename: `estimativa-${estimativa.nome_projeto.replace(/\s+/g, '-').toLowerCase()}`
      })
      
      if (result.success) {
        toast.success('PDF gerado com sucesso!')
      } else {
        toast.error('Erro ao gerar PDF: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleShareLink = async () => {
    if (!estimativa) return
    
    try {
      setGeneratingLink(true)
      
      // Verificar se já existe link público
      const { data: existingLink } = await supabase
        .from('estimativas_publicas')
        .select('token')
        .eq('estimativa_id', estimativaId)
        .single()
      
      let token = existingLink?.token
      
      if (!token) {
        // Gerar novo token (função simples no frontend)
        const generateToken = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          let result = ''
          for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return result
        }
        
        token = generateToken()
        
        // Criar link público
        const { error: insertError } = await supabase
          .from('estimativas_publicas')
          .insert({
            estimativa_id: estimativaId,
            token: token,
            created_by: estimativa.created_by
          })
        
        if (insertError) throw insertError
      }
      
      // Gerar URL pública
      const publicUrl = `${window.location.origin}/estimativa/${token}`
      setShareUrl(publicUrl)
      setShareModalOpen(true)
      
    } catch (error) {
      console.error('Erro ao gerar link:', error)
      toast.error('Erro ao gerar link de compartilhamento')
    } finally {
      setGeneratingLink(false)
    }
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
    <div className="min-h-screen overflow-y-auto">
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{estimativa.nome_projeto}</h1>
              <Badge className={statusConfig[estimativa.status as keyof typeof statusConfig]?.className || "bg-gradient-to-r from-slate-500 to-gray-600 text-white font-semibold shadow-sm"}>
                {statusConfig[estimativa.status as keyof typeof statusConfig]?.label || estimativa.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <p>
                Criado em {formatDate(estimativa.created_at)}
              </p>
              {estimativa.profiles?.full_name && (
                <p className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {estimativa.profiles.full_name}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShareLink}
            disabled={generatingLink}
          >
            <Share className="h-4 w-4 mr-2" />
            {generatingLink ? 'Gerando...' : 'Compartilhar'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {generatingPDF ? 'Gerando...' : 'Exportar PDF'}
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

      <div className="space-y-6">
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

        {/* Resumo Financeiro e Estatísticas */}
        <div className="grid gap-6 md:grid-cols-2">
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

        {/* Recursos da Estimativa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recursos da Estimativa
            </CardTitle>
            <CardDescription>
              Equipe e custos por recurso
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
                  <div key={recurso.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{recurso.nome_recurso}</h4>
                        <p className="text-sm text-muted-foreground">
                          Taxa: {formatCurrency(recurso.taxa_hora)}/hora
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(recurso.total_custo)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {recurso.total_horas.toFixed(1)} horas totais
                        </p>
                      </div>
                    </div>
                    
                    {/* Resumo por mês */}
                    <div className="mt-4">
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">
                        Distribuição por Mês:
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => {
                          const semanasDoMes = semanas.slice(mesIndex * 4, (mesIndex + 1) * 4)
                          const horasDoMes = semanasDoMes.reduce((total, semana) => {
                            const alocacao = recurso.alocacoes.find(a => a.semana === semana)
                            return total + (alocacao?.horas || 0)
                          }, 0)
                          const custoDoMes = horasDoMes * recurso.taxa_hora
                          
                          return (
                            <div key={mesIndex} className="bg-white p-3 rounded border text-center">
                              <div className="text-sm font-medium text-muted-foreground">
                                Mês {mesIndex + 1}
                              </div>
                              <div className="text-lg font-semibold text-primary">
                                {formatCurrency(custoDoMes)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {horasDoMes.toFixed(1)}h
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Confirmação */}
      {ConfirmationDialog}
      
      {/* Modal de Compartilhamento */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        projectName={estimativa?.nome_projeto || ''}
      />
      </div>
    </div>
  )
}
