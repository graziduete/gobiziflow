"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calculator,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Download
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEstimativaDownload } from "@/hooks/use-estimativa-download"
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

export default function PublicEstimativaPage() {
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null)
  const [recursos, setRecursos] = useState<RecursoEstimativa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  const { downloadEstimativaPDF } = useEstimativaDownload()

  useEffect(() => {
    const token = window.location.pathname.split('/').pop()
    if (token) {
      fetchPublicEstimativa(token)
    }
  }, [])

  const fetchPublicEstimativa = async (token: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Buscar link público
      const { data: publicLink, error: linkError } = await supabase
        .from('estimativas_publicas')
        .select('estimativa_id')
        .eq('token', token)
        .single()

      if (linkError || !publicLink) {
        setError('Link inválido ou expirado')
        return
      }

      // Registrar acesso (atualizar contador)
      await supabase
        .from('estimativas_publicas')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .eq('token', token)

      // Buscar estimativa
      const { data: estimativaData, error: estimativaError } = await supabase
        .from('estimativas')
        .select('*')
        .eq('id', publicLink.estimativa_id)
        .single()

      if (estimativaError || !estimativaData) {
        setError('Estimativa não encontrada')
        return
      }

      setEstimativa(estimativaData)

      // Buscar recursos
      const { data: recursosData, error: recursosError } = await supabase
        .from('recursos_estimativa')
        .select('*')
        .eq('estimativa_id', publicLink.estimativa_id)
        .order('ordem')

      if (recursosError) {
        console.error('Erro ao buscar recursos:', recursosError)
        return
      }

      // Buscar alocações semanais
      const recursosComAlocacoes = await Promise.all(
        (recursosData || []).map(async (recurso) => {
          const { data: alocacoesData } = await supabase
            .from('alocacao_semanal')
            .select('*')
            .eq('recurso_id', recurso.id)
            .order('semana')

          return {
            ...recurso,
            alocacoes: alocacoesData || []
          }
        })
      )

      setRecursos(recursosComAlocacoes)

    } catch (error) {
      console.error('Erro ao buscar estimativa pública:', error)
      setError('Erro ao carregar estimativa')
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estimativa...</p>
        </div>
      </div>
    )
  }

  if (error || !estimativa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Calculator className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Estimativa não encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'A estimativa solicitada não existe ou foi removida.'}
            </p>
            <Button onClick={() => window.close()}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const semanas = Array.from({ length: estimativa.meses_previstos * 4 }, (_, i) => i + 1)

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
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
            <Button 
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Gerando...' : 'Exportar PDF'}
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

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Este documento foi gerado automaticamente pelo sistema GobiZi Flow</p>
        </div>
      </div>
    </div>
  )
}
