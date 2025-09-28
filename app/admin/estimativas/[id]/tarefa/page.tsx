"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  ArrowLeft,
  Edit,
  Share,
  Download,
  FileText,
  TrendingUp,
  Clock,
  Target,
  Settings,
  DollarSign,
  User,
  Trash2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEstimativaDownload } from "@/hooks/use-estimativa-download"
import { ShareModal } from "@/components/ui/share-modal"
import { useToast } from "@/hooks/use-toast"

interface Estimativa {
  id: string
  nome_projeto: string
  meses_previstos: number
  status: string
  total_estimado: number
  total_com_impostos: number
  percentual_imposto: number
  valor_hora: number
  percentual_gordura: number
  observacoes: string
  created_at: string
  updated_at: string
  created_by: string
  tipo: string
  user_name?: string
}

const statusConfig = {
  proposta_comercial: { label: "Proposta Comercial", variant: "default" as const },
  em_aprovacao: { label: "Em Aprovação", variant: "secondary" as const },
  aprovada: { label: "Aprovada", variant: "default" as const },
  rejeitada: { label: "Rejeitada", variant: "destructive" as const },
  convertida_projeto: { label: "Convertida em Projeto", variant: "outline" as const },
}

interface TarefaEstimativa {
  id: string
  funcionalidade: string
  tecnologia_id: string
  complexidade_id: string
  tipo_tarefa_id: string
  quantidade: number
  nota_descricao: string
  fator_aplicado: number
  total_base: number
  total_com_gordura: number
  tecnologia_nome?: string
  complexidade_nome?: string
  tipo_tarefa_nome?: string
}

export default function VisualizarEstimativaTarefaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: estimativaId } = React.use(params)
  const supabase = createClient()
  const { downloadTarefasPDF } = useEstimativaDownload()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null)
  const [tarefas, setTarefas] = useState<TarefaEstimativa[]>([])
  const [generatingLink, setGeneratingLink] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetchEstimativa()
  }, [estimativaId])

  const fetchEstimativa = async () => {
    try {
      setLoading(true)

      // Buscar estimativa (sem JOIN para evitar problemas de RLS)
      const { data: estimativaData, error: estimativaError } = await supabase
        .from('estimativas')
        .select('*')
        .eq('id', estimativaId)
        .single()

      if (estimativaError) throw estimativaError

      // Buscar dados do usuário separadamente
      let userName = 'Usuário'
      if (estimativaData.created_by) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', estimativaData.created_by)
          .single()
        
        if (userData?.full_name) {
          userName = userData.full_name
        }
      }

      // Buscar tarefas
      const { data: tarefasData, error: tarefasError } = await supabase
        .from('tarefas_estimativa')
        .select('*')
        .eq('estimativa_id', estimativaId)

      if (tarefasError) throw tarefasError

      // Buscar dados relacionados das tarefas
      const tarefasProcessadas = []
      for (const tarefa of tarefasData || []) {
        // Buscar tecnologia
        const { data: tecnologia } = await supabase
          .from('tecnologias')
          .select('nome')
          .eq('id', tarefa.tecnologia_id)
          .single()

        // Buscar complexidade
        const { data: complexidade } = await supabase
          .from('complexidades')
          .select('nome')
          .eq('id', tarefa.complexidade_id)
          .single()

        // Buscar tipo de tarefa
        const { data: tipoTarefa } = await supabase
          .from('tipos_tarefa')
          .select('nome')
          .eq('id', tarefa.tipo_tarefa_id)
          .single()

        tarefasProcessadas.push({
          ...tarefa,
          tecnologia_nome: tecnologia?.nome || 'N/A',
          complexidade_nome: complexidade?.nome || 'N/A',
          tipo_tarefa_nome: tipoTarefa?.nome || 'N/A'
        })
      }

      // Processar dados
      const estimativaProcessada = {
        ...estimativaData,
        user_name: userName
      }

      setEstimativa(estimativaProcessada)
      setTarefas(tarefasProcessadas)

    } catch (error) {
      console.error('Erro ao buscar estimativa:', error)
      toast({
        title: "Erro!",
        description: "Erro ao carregar estimativa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!estimativa) return
    
    try {
      setGeneratingPDF(true)
      const result = await downloadTarefasPDF(estimativa, tarefas, {
        filename: `proposta-comercial-${estimativa.nome_projeto.replace(/\s+/g, '-').toLowerCase()}`,
        clientVersion: true
      })
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "PDF gerado com sucesso!",
          variant: "success"
        })
      } else {
        toast({
          title: "Erro!",
          description: `Erro ao gerar PDF: ${result.error}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro!",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      })
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
        // Gerar novo token
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
      toast({
        title: "Erro!",
        description: "Erro ao gerar link de compartilhamento",
        variant: "destructive"
      })
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleDelete = async () => {
    if (!estimativa) return
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a estimativa "${estimativa.nome_projeto}"? Esta ação não pode ser desfeita.`
    )
    
    if (!confirmed) return
    
    try {
      // Excluir tarefas relacionadas primeiro
      const { error: tarefasError } = await supabase
        .from('tarefas_estimativa')
        .delete()
        .eq('estimativa_id', estimativaId)
      
      if (tarefasError) throw tarefasError
      
      // Excluir links públicos
      await supabase
        .from('estimativas_publicas')
        .delete()
        .eq('estimativa_id', estimativaId)
      
      // Excluir a estimativa
      const { error: estimativaError } = await supabase
        .from('estimativas')
        .delete()
        .eq('id', estimativaId)
      
      if (estimativaError) throw estimativaError
      
      toast({
        title: "Estimativa excluída",
        description: "A estimativa foi excluída com sucesso.",
      })
      
      // Redirecionar para a lista
      router.push('/admin/estimativas')
    } catch (error) {
      console.error('Erro ao excluir estimativa:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a estimativa. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando estimativa...</p>
        </div>
      </div>
    )
  }

  if (!estimativa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-32 w-32 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Estimativa não encontrada</h2>
          <p className="text-muted-foreground mb-4">A estimativa solicitada não existe ou foi removida.</p>
          <Button onClick={() => router.push('/admin/estimativas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Estimativas
          </Button>
        </div>
      </div>
    )
  }

  // Calcular totais
  const totalBase = tarefas.reduce((total, tarefa) => total + tarefa.total_base, 0)
  const totalComGordura = tarefas.reduce((total, tarefa) => total + tarefa.total_com_gordura, 0)
  const totalHoras = Math.round(totalComGordura * 10) / 10  // Arredondar para 1 casa decimal
  const totalEstimado = Math.round((totalHoras * estimativa.valor_hora) * 100) / 100
  const impostos = Math.round((totalEstimado * estimativa.percentual_imposto / 100) * 100) / 100
  const totalComImpostos = Math.round((totalEstimado + impostos) * 100) / 100

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/estimativas')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{estimativa.nome_projeto}</h1>
                  <Badge variant={statusConfig[estimativa.status as keyof typeof statusConfig]?.variant || "default"}>
                    {statusConfig[estimativa.status as keyof typeof statusConfig]?.label || estimativa.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Estimativa baseada em tarefas e complexidade tecnológica
                </p>
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
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingPDF ? 'Gerando...' : 'Exportar PDF'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/admin/estimativas/${estimativaId}/editar-tarefa`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
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

          {/* Informações do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome do Projeto</Label>
                  <p className="text-lg font-semibold">{estimativa.nome_projeto}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Hora</Label>
                  <p className="text-lg font-semibold">
                    R$ {estimativa.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Gordura</Label>
                  <p className="text-lg font-semibold">{estimativa.percentual_gordura}%</p>
                </div>
                <div>
                  {/* Espaço vazio para manter o layout equilibrado */}
                </div>
              </div>

              {estimativa.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{estimativa.observacoes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Criado por: {estimativa.user_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Criado em: {new Date(estimativa.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tarefas do Projeto ({tarefas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tarefas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                    <div className="col-span-3">Funcionalidade</div>
                    <div className="col-span-1 text-center">Qtd</div>
                    <div className="col-span-2">Tecnologia</div>
                    <div className="col-span-1">Complexidade</div>
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-1 text-center">Fator</div>
                    <div className="col-span-1 text-center">Total Base</div>
                    <div className="col-span-2 text-center">Com Gordura</div>
                  </div>

                  {/* Linhas das tarefas */}
                  {tarefas.map((tarefa, index) => (
                    <div key={tarefa.id} className="grid grid-cols-12 gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      {/* Funcionalidade */}
                      <div className="col-span-3 flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium text-sm">{tarefa.funcionalidade}</span>
                      </div>

                      {/* Quantidade */}
                      <div className="col-span-1 text-center flex items-center justify-center">
                        <span className="text-sm">{tarefa.quantidade}</span>
                      </div>

                      {/* Tecnologia */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm">{tarefa.tecnologia_nome}</span>
                      </div>

                      {/* Complexidade */}
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm">{tarefa.complexidade_nome}</span>
                      </div>

                      {/* Tipo */}
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm">{tarefa.tipo_tarefa_nome}</span>
                      </div>

                      {/* Fator */}
                      <div className="col-span-1 text-center flex items-center justify-center">
                        <span className="text-sm font-medium">{tarefa.fator_aplicado.toFixed(1)}</span>
                      </div>

                      {/* Total Base */}
                      <div className="col-span-1 text-center flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{tarefa.total_base.toFixed(1)}h</span>
                      </div>

                      {/* Com Gordura */}
                      <div className="col-span-2 text-center flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">{tarefa.total_com_gordura.toFixed(1)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Base:</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {totalBase.toFixed(1)}h
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Com Gordura ({estimativa.percentual_gordura}%):</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {totalComGordura.toFixed(1)}h
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Valor Hora:</span>
                </div>
                <p className="text-lg font-semibold">
                  R$ {estimativa.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Impostos ({estimativa.percentual_imposto}%):</span>
                    <span className="font-medium">
                      R$ {impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Geral:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {totalComImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Compartilhamento */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareUrl={shareUrl}
          projectName={estimativa.nome_projeto}
        />
      </div>
    </div>
  )
}

// Componente Label para reutilização
function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}