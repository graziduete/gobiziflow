"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Calculator, 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  FileText
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TemplateRecurso {
  id: string
  nome: string
  taxa_hora_padrao: number
  descricao: string
}

interface RecursoEstimativa {
  id: string
  nome_recurso: string
  taxa_hora: number
  total_horas: number
  total_custo: number
  alocacoes: { semana: number; horas: number }[]
}

export default function NovaEstimativaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') || 'recurso'
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<TemplateRecurso[]>([])
  const [recursos, setRecursos] = useState<RecursoEstimativa[]>([])
  const [formData, setFormData] = useState({
    nome_projeto: '',
    meses_previstos: 1,
    percentual_imposto: 15.53,
    observacoes: ''
  })
  const [mesesInput, setMesesInput] = useState('1')

  // Carregar templates de recursos
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates_recursos')
          .select('*')
          .order('nome')

        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error('Erro ao carregar templates:', error)
        // Se não encontrar templates, usar lista padrão
        setTemplates([
          { id: '1', nome: 'Gerente de Projeto', taxa_hora_padrao: 150.00, descricao: 'Gestão geral do projeto' },
          { id: '2', nome: 'Desenvolvedor Full Stack', taxa_hora_padrao: 120.00, descricao: 'Desenvolvimento completo' },
          { id: '3', nome: 'Desenvolvedor Frontend', taxa_hora_padrao: 100.00, descricao: 'Interface e UX' },
          { id: '4', nome: 'Desenvolvedor Backend', taxa_hora_padrao: 110.00, descricao: 'APIs e lógica' },
          { id: '5', nome: 'QA/Tester', taxa_hora_padrao: 80.00, descricao: 'Testes e qualidade' },
          { id: '6', nome: 'Arquiteto de Software', taxa_hora_padrao: 180.00, descricao: 'Arquitetura técnica' },
          { id: '7', nome: 'Consultor Técnico', taxa_hora_padrao: 200.00, descricao: 'Consultoria especializada' },
          { id: '8', nome: 'Designer UX/UI', taxa_hora_padrao: 90.00, descricao: 'Design de interface' },
          { id: '9', nome: 'DevOps', taxa_hora_padrao: 130.00, descricao: 'Infraestrutura e deploy' },
          { id: '10', nome: 'Analista de Negócios', taxa_hora_padrao: 95.00, descricao: 'Análise de requisitos' },
          { id: '11', nome: 'Analista de Dados', taxa_hora_padrao: 105.00, descricao: 'Análise e ciência de dados' },
          { id: '12', nome: 'Desenvolvedor RPA', taxa_hora_padrao: 115.00, descricao: 'Automação de processos' },
          { id: '13', nome: 'Engenheiro de Software', taxa_hora_padrao: 140.00, descricao: 'Engenharia de software' }
        ])
      }
    }

    loadTemplates()
  }, [supabase])

  // Calcular totais
  const totalEstimado = recursos.reduce((total, recurso) => total + recurso.total_custo, 0)
  const totalComImpostos = totalEstimado * (1 + formData.percentual_imposto / 100)

  // Gerar semanas baseado nos meses
  const semanas = Array.from({ length: formData.meses_previstos * 4 }, (_, i) => i + 1)

  const addRecurso = (template: TemplateRecurso) => {
    const novoRecurso: RecursoEstimativa = {
      id: Math.random().toString(36).substr(2, 9),
      nome_recurso: template.nome,
      taxa_hora: template.taxa_hora_padrao,
      total_horas: 0,
      total_custo: 0,
      alocacoes: Array.from({ length: formData.meses_previstos * 4 }, (_, i) => ({
        semana: i + 1,
        horas: 0
      }))
    }
    setRecursos([...recursos, novoRecurso])
  }

  const updateRecurso = (id: string, field: keyof RecursoEstimativa, value: any) => {
    setRecursos(recursos.map(recurso => {
      if (recurso.id === id) {
        const updated = { ...recurso, [field]: value }
        
        // Recalcular totais se taxa_hora mudou
        if (field === 'taxa_hora') {
          updated.total_custo = updated.total_horas * value
        }
        
        return updated
      }
      return recurso
    }))
  }

  const updateAlocacao = (recursoId: string, semana: number, horas: number) => {
    setRecursos(recursos.map(recurso => {
      if (recurso.id === recursoId) {
        const alocacoes = recurso.alocacoes.map(aloc => 
          aloc.semana === semana ? { ...aloc, horas } : aloc
        )
        
        const total_horas = alocacoes.reduce((total, aloc) => total + aloc.horas, 0)
        const total_custo = total_horas * recurso.taxa_hora
        
        return {
          ...recurso,
          alocacoes,
          total_horas,
          total_custo
        }
      }
      return recurso
    }))
  }

  const removeRecurso = (id: string) => {
    setRecursos(recursos.filter(recurso => recurso.id !== id))
  }

  const handleSave = async () => {
    if (!formData.nome_projeto.trim()) {
      toast.error('Nome do projeto é obrigatório')
      return
    }

    if (recursos.length === 0) {
      toast.error('Adicione pelo menos um recurso')
      return
    }

    try {
      setLoading(true)

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Criar estimativa
      const { data: estimativa, error: estimativaError } = await supabase
        .from('estimativas')
        .insert({
          nome_projeto: formData.nome_projeto,
          meses_previstos: formData.meses_previstos,
          percentual_imposto: formData.percentual_imposto,
          observacoes: formData.observacoes,
          total_estimado: totalEstimado,
          total_com_impostos: totalComImpostos,
          status: 'proposta_comercial',
          created_by: user.id
        })
        .select()
        .single()

      if (estimativaError) throw estimativaError

      // Criar recursos
      for (const recurso of recursos) {
        const { data: recursoData, error: recursoError } = await supabase
          .from('recursos_estimativa')
          .insert({
            estimativa_id: estimativa.id,
            nome_recurso: recurso.nome_recurso,
            taxa_hora: recurso.taxa_hora,
            total_horas: recurso.total_horas,
            total_custo: recurso.total_custo,
            ordem: recursos.indexOf(recurso)
          })
          .select()
          .single()

        if (recursoError) throw recursoError

        // Criar alocações semanais
        const alocacoesData = recurso.alocacoes
          .filter(aloc => aloc.horas > 0)
          .map(aloc => ({
            recurso_id: recursoData.id,
            semana: aloc.semana,
            horas: aloc.horas,
            custo_semanal: aloc.horas * recurso.taxa_hora
          }))

        if (alocacoesData.length > 0) {
          const { error: alocacaoError } = await supabase
            .from('alocacao_semanal')
            .insert(alocacoesData)

          if (alocacaoError) throw alocacaoError
        }
      }

      toast.success('Estimativa criada com sucesso!')
      router.push('/admin/estimativas')
    } catch (error) {
      console.error('Erro ao salvar estimativa:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Erro ao salvar estimativa'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Erro: ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (tipo === 'tarefa') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Estimativa - Por Tarefa</h1>
            <p className="text-muted-foreground">
              Esta funcionalidade será implementada em breve
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Estimativa por Tarefa</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.
            </p>
            <Button onClick={() => router.push('/admin/estimativas/nova?tipo=recurso')}>
              Usar Estimativa por Recurso
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Nova Estimativa</h1>
            <Badge variant="secondary" className="bg-blue-500 text-white border-blue-400 text-sm px-3 py-1">
              Por Recurso
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Crie uma estimativa detalhada alocando recursos e horas por semana
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Formulário Principal */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
              <CardDescription>
                Defina os dados básicos da estimativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-8">
                <div className="space-y-2 md:col-span-4">
                  <Label htmlFor="nome_projeto">Nome do Projeto *</Label>
                  <Input
                    id="nome_projeto"
                    value={formData.nome_projeto}
                    onChange={(e) => setFormData({...formData, nome_projeto: e.target.value})}
                    placeholder="Ex: Sistema de Gestão Empresarial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value="Proposta Comercial"
                    disabled
                    className="bg-gray-100 cursor-not-allowed text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meses_previstos">Meses Previstos *</Label>
                  <Input
                    id="meses_previstos"
                    type="number"
                    min="1"
                    value={mesesInput}
                    onChange={(e) => {
                      setMesesInput(e.target.value)
                    }}
                    onBlur={(e) => {
                      const valor = e.target.value
                      if (valor === '' || parseInt(valor) < 1) {
                        setMesesInput('1')
                        setFormData({...formData, meses_previstos: 1})
                        return
                      }
                      const meses = parseInt(valor)
                      setFormData({...formData, meses_previstos: meses})
                      // Atualizar alocações dos recursos existentes
                      setRecursos(recursos.map(recurso => ({
                        ...recurso,
                        alocacoes: Array.from({ length: meses * 4 }, (_, i) => ({
                          semana: i + 1,
                          horas: recurso.alocacoes[i]?.horas || 0
                        }))
                      })))
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentual_imposto">Impostos (%)</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="percentual_imposto"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percentual_imposto}
                      onChange={(e) => setFormData({...formData, percentual_imposto: parseFloat(e.target.value) || 0})}
                      className="text-right text-xs"
                      placeholder="15.53"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais sobre a estimativa..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recursos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recursos
              </CardTitle>
              <CardDescription>
                Adicione e configure os recursos para a estimativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar Recurso */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Recurso
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => addRecurso(template)}
                      >
                        {template.nome}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Lista de Recursos */}
              <div className="space-y-4">
                {recursos.map((recurso) => (
                  <RecursoCard
                    key={recurso.id}
                    recurso={recurso}
                    semanas={semanas}
                    onUpdate={(field, value) => updateRecurso(recurso.id, field, value)}
                    onUpdateAlocacao={(semana, horas) => updateAlocacao(recurso.id, semana, horas)}
                    onRemove={() => removeRecurso(recurso.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo da Estimativa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo da Estimativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo Principal */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total de Horas</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {recursos.reduce((total, recurso) => total + recurso.total_horas, 0).toFixed(1)}h
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Subtotal (sem impostos)</span>
                  </div>
                  <p className="text-2xl font-bold">
                    R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Impostos ({formData.percentual_imposto}%)</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {(totalComImpostos - totalEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Geral do Projeto</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {totalComImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Detalhamento por Recurso */}
              {recursos.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-4">Detalhamento por Recurso</h4>
                    <div className="space-y-3">
                      {recursos.map((recurso, index) => (
                        <div key={recurso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{recurso.nome_recurso}</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {recurso.taxa_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Horas</p>
                              <p className="font-semibold">{recurso.total_horas.toFixed(1)}h</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Custo</p>
                              <p className="font-semibold">
                                R$ {recurso.total_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">% do Total</p>
                              <p className="font-semibold">
                                {totalEstimado > 0 ? ((recurso.total_custo / totalEstimado) * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Estimativa'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente RecursoCard
function RecursoCard({ 
  recurso, 
  semanas, 
  onUpdate, 
  onUpdateAlocacao, 
  onRemove 
}: {
  recurso: RecursoEstimativa
  semanas: number[]
  onUpdate: (field: keyof RecursoEstimativa, value: any) => void
  onUpdateAlocacao: (semana: number, horas: number) => void
  onRemove: () => void
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label htmlFor={`nome-${recurso.id}`}>Nome do Recurso</Label>
            <Input
              id={`nome-${recurso.id}`}
              value={recurso.nome_recurso}
              disabled
              className="font-medium bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`taxa-${recurso.id}`}>Taxa por Hora (R$)</Label>
            <Input
              id={`taxa-${recurso.id}`}
              type="number"
              step="0.01"
              min="0"
              value={recurso.taxa_hora || ''}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || value === '0') {
                  onUpdate('taxa_hora', 0)
                } else {
                  onUpdate('taxa_hora', parseFloat(value) || 0)
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {recurso.total_horas.toFixed(1)}h
          </Badge>
          <Badge variant="outline">
            R$ {recurso.total_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Alocação por Semana</Label>
        {Math.ceil(semanas.length / 4) <= 10 ? (
          // Layout compacto para projetos até 10 meses
          <div className="space-y-2">
            {/* Cabeçalho dos Meses */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(semanas.length / 4)}, 1fr)` }}>
              {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => (
                <div key={mesIndex} className={`text-center font-semibold text-sm py-1 rounded ${
                  mesIndex % 2 === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  MÊS {mesIndex + 1}
                </div>
              ))}
            </div>
            
            {/* Cabeçalho das Semanas */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(semanas.length / 4)}, 1fr)` }}>
              {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => (
                <div key={mesIndex} className={`grid grid-cols-4 gap-1 p-1 rounded ${
                  mesIndex % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  {Array.from({ length: 4 }, (_, semanaIndex) => {
                    const numeroSemana = (mesIndex * 4) + semanaIndex + 1
                    return (
                      <div key={semanaIndex} className="text-center text-xs text-muted-foreground font-medium">
                        {numeroSemana}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            
            {/* Campos de Input */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(semanas.length / 4)}, 1fr)` }}>
              {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => {
                const semanasDoMes = semanas.slice(mesIndex * 4, (mesIndex + 1) * 4)
                return (
                  <div key={mesIndex} className={`grid grid-cols-4 gap-1 p-1 rounded ${
                    mesIndex % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    {semanasDoMes.map((semana) => (
                      <Input
                        key={semana}
                        type="number"
                        min="0"
                        step="0.5"
                        value={recurso.alocacoes[semana - 1]?.horas || ''}
                        onChange={(e) => onUpdateAlocacao(semana, parseFloat(e.target.value) || 0)}
                        className="h-6 text-center text-xs px-1 w-12"
                        placeholder="0"
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Layout com scroll para projetos longos
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Projeto longo ({Math.ceil(semanas.length / 4)} meses) - Use a barra de rolagem horizontal
            </div>
            <div className="overflow-x-auto">
            <div className="min-w-max space-y-2">
              {/* Cabeçalho dos Meses */}
              <div className="flex gap-4">
                {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => (
                  <div key={mesIndex} className={`text-center font-semibold text-sm py-2 rounded w-36 ${
                    mesIndex % 2 === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    MÊS {mesIndex + 1}
                  </div>
                ))}
              </div>
              
              {/* Cabeçalho das Semanas */}
              <div className="flex gap-4">
                {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => (
                  <div key={mesIndex} className={`grid grid-cols-4 gap-6 p-4 rounded w-36 ${
                    mesIndex % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    {Array.from({ length: 4 }, (_, semanaIndex) => {
                      const numeroSemana = (mesIndex * 4) + semanaIndex + 1
                      return (
                        <div key={semanaIndex} className="text-center text-xs text-muted-foreground font-medium">
                          {numeroSemana}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              
              {/* Campos de Input */}
              <div className="flex gap-4">
                {Array.from({ length: Math.ceil(semanas.length / 4) }, (_, mesIndex) => {
                  const semanasDoMes = semanas.slice(mesIndex * 4, (mesIndex + 1) * 4)
                  return (
                    <div key={mesIndex} className={`grid grid-cols-4 gap-6 p-4 rounded w-36 ${
                      mesIndex % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {semanasDoMes.map((semana) => (
                        <Input
                          key={semana}
                          type="number"
                          min="0"
                          step="0.5"
                          value={recurso.alocacoes[semana - 1]?.horas || ''}
                          onChange={(e) => onUpdateAlocacao(semana, parseFloat(e.target.value) || 0)}
                          className="h-9 text-center text-sm px-3 w-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}