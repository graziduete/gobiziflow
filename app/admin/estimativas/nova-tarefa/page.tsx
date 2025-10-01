"use client"

import { useState, useEffect, Suspense } from "react"
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
  FileText,
  Settings,
  TrendingUp,
  Clock,
  Target,
  ChevronDown
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Tecnologia {
  id: string
  nome: string
}

interface Complexidade {
  id: string
  codigo: string
  nome: string
  ordem: number
}

interface TipoTarefa {
  id: string
  nome: string
}

interface FatorEstimativa {
  id: string
  tecnologia_id: string
  complexidade_id: string
  tipo_tarefa_id: string
  fator_novo: number
  fator_alteracao: number
  balizador: number
}

interface TarefaEstimativa {
  id: string
  funcionalidade: string
  tecnologia_id: string
  complexidade_id: string
  tipo_tarefa_id: string
  quantidade: number
  fator_aplicado: number
  total_base: number
  total_com_gordura: number
  tecnologia_nome?: string
  complexidade_nome?: string
  tipo_tarefa_nome?: string
}

function NovaEstimativaTarefaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') || 'tarefa'
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([])
  const [complexidades, setComplexidades] = useState<Complexidade[]>([])
  const [tiposTarefa, setTiposTarefa] = useState<TipoTarefa[]>([])
  const [fatoresEstimativa, setFatoresEstimativa] = useState<FatorEstimativa[]>([])
  const [tarefas, setTarefas] = useState<TarefaEstimativa[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome_projeto: '',
    percentual_imposto: 15.53,
    valor_hora: 100,
    percentual_gordura: 40,
    observacoes: ''
  })

  // Buscar perfil do usuário
  useEffect(() => {
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
    
    fetchUserRole()
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Carregar tecnologias
        const { data: tecnologiasData } = await supabase
          .from('tecnologias')
          .select('*')
          .eq('ativo', true)
          .order('nome')
        
        // Carregar complexidades
        const { data: complexidadesData } = await supabase
          .from('complexidades')
          .select('*')
          .eq('ativo', true)
          .order('ordem')
        
        // Carregar tipos de tarefa
        const { data: tiposData } = await supabase
          .from('tipos_tarefa')
          .select('*')
          .eq('ativo', true)
        
        // Carregar fatores de estimativa
        const { data: fatoresData } = await supabase
          .from('fatores_estimativa')
          .select('*')
        
        setTecnologias(tecnologiasData || [])
        setComplexidades(complexidadesData || [])
        setTiposTarefa(tiposData || [])
        setFatoresEstimativa(fatoresData || [])
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Recalcular tarefas quando percentual de gordura mudar
  useEffect(() => {
    if (tarefas.length > 0) {
      setTarefas(tarefas.map(tarefa => {
        const fator = getFatorEstimativa(tarefa.tecnologia_id, tarefa.complexidade_id, tarefa.tipo_tarefa_id)
        const quantidade = Math.max(1, tarefa.quantidade || 1)
        const totalBase = Math.round((fator * quantidade) * 100) / 100
        const totalComGordura = Math.round((totalBase * (1 + formData.percentual_gordura / 100)) * 100) / 100
        
        return {
          ...tarefa,
          fator_aplicado: fator,
          total_base: totalBase,
          total_com_gordura: totalComGordura
        }
      }))
    }
  }, [formData.percentual_gordura])

  // Calcular totais
  const totalBase = tarefas.reduce((total, tarefa) => total + tarefa.total_base, 0)
  const totalComGordura = tarefas.reduce((total, tarefa) => total + tarefa.total_com_gordura, 0)
  const totalHoras = Math.round(totalComGordura * 10) / 10  // Arredondar para 1 casa decimal (como exibido)
  const totalEstimado = Math.round((totalHoras * formData.valor_hora) * 100) / 100
  const impostos = Math.round((totalEstimado * formData.percentual_imposto / 100) * 100) / 100
  const totalComImpostos = Math.round((totalEstimado + impostos) * 100) / 100

  // Adicionar nova tarefa
  const addTarefa = () => {
    const novaTarefa: TarefaEstimativa = {
      id: Date.now().toString(),
      funcionalidade: '',
      tecnologia_id: '',
      complexidade_id: '',
      tipo_tarefa_id: '',
      quantidade: 1,
      fator_aplicado: 0,
      total_base: 0,
      total_com_gordura: 0
    }
    setTarefas([...tarefas, novaTarefa])
  }

  // Remover tarefa
  const removeTarefa = (id: string) => {
    setTarefas(tarefas.filter(tarefa => tarefa.id !== id))
  }

  // Atualizar tarefa
  const updateTarefa = (id: string, field: keyof TarefaEstimativa, value: any) => {
    setTarefas(tarefas.map(tarefa => {
      if (tarefa.id === id) {
        const updatedTarefa = { ...tarefa, [field]: value }
        
        // Recalcular se mudou tecnologia, complexidade, tipo ou quantidade
        if (['tecnologia_id', 'complexidade_id', 'tipo_tarefa_id', 'quantidade'].includes(field)) {
        const fator = getFatorEstimativa(updatedTarefa.tecnologia_id, updatedTarefa.complexidade_id, updatedTarefa.tipo_tarefa_id)
        const quantidade = Math.max(1, updatedTarefa.quantidade || 1)
        const totalBase = Math.round((fator * quantidade) * 100) / 100
        const totalComGordura = Math.round((totalBase * (1 + formData.percentual_gordura / 100)) * 100) / 100
          
          updatedTarefa.fator_aplicado = fator
          updatedTarefa.total_base = totalBase
          updatedTarefa.total_com_gordura = totalComGordura
        }
        
        return updatedTarefa
      }
      return tarefa
    }))
  }

  // Buscar fator de estimativa
  const getFatorEstimativa = (tecnologiaId: string, complexidadeId: string, tipoTarefaId: string) => {
    const fator = fatoresEstimativa.find(f => 
      f.tecnologia_id === tecnologiaId && 
      f.complexidade_id === complexidadeId && 
      f.tipo_tarefa_id === tipoTarefaId
    )
    
    if (!fator) return 0
    
    // Retornar fator baseado no tipo de tarefa (valor bruto da planilha)
    const tipoTarefa = tiposTarefa.find(t => t.id === tipoTarefaId)
    if (tipoTarefa?.nome === 'NOVO') return fator.fator_novo
    if (tipoTarefa?.nome === 'ALTERAÇÃO') return fator.fator_alteracao
    return fator.fator_novo
  }

  // Salvar estimativa
  const handleSave = async () => {
    if (!formData.nome_projeto.trim()) {
      toast({
        title: "Atenção!",
        description: "Nome do projeto é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (tarefas.length === 0) {
      toast({
        title: "Atenção!",
        description: "Adicione pelo menos uma tarefa",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        return
      }

      // Criar estimativa
      const { data: estimativa, error: estimativaError } = await supabase
        .from('estimativas')
        .insert({
          nome_projeto: formData.nome_projeto,
          meses_previstos: 1, // Fixo para estimativas por tarefa
          percentual_imposto: formData.percentual_imposto || 0,
          observacoes: formData.observacoes || '',
          total_estimado: totalEstimado,
          total_com_impostos: totalComImpostos,
          status: 'proposta_comercial',
          created_by: user.id,
          tipo: 'tarefa',
          valor_hora: formData.valor_hora,
          percentual_gordura: formData.percentual_gordura || 0
        })
        .select()
        .single()

      if (estimativaError) throw estimativaError

      // Criar tarefas
      for (const tarefa of tarefas) {
        const { error: tarefaError } = await supabase
          .from('tarefas_estimativa')
          .insert({
            estimativa_id: estimativa.id,
            funcionalidade: tarefa.funcionalidade,
            tecnologia_id: tarefa.tecnologia_id,
            complexidade_id: tarefa.complexidade_id,
            tipo_tarefa_id: tarefa.tipo_tarefa_id,
            quantidade: tarefa.quantidade,
            fator_aplicado: tarefa.fator_aplicado,
            total_base: tarefa.total_base,
            total_com_gordura: tarefa.total_com_gordura
          })

        if (tarefaError) throw tarefaError
      }

      toast({
        title: "Sucesso!",
        description: "Estimativa criada com sucesso!",
        variant: "success"
      })
      router.push('/admin/estimativas')
    } catch (error) {
      console.error('Erro ao salvar estimativa:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      toast({
        title: "Erro!",
        description: `Erro ao salvar estimativa: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/estimativas')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Nova Estimativa</h1>
              <Badge className="bg-green-500 text-white border-green-400 text-sm px-3 py-1">
                Por Tarefa
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Crie uma estimativa baseada em tarefas e complexidade tecnológica
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Formulário Principal */}
          <div className="space-y-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="nome_projeto">Nome do Projeto</Label>
                    <Input
                      id="nome_projeto"
                      value={formData.nome_projeto}
                      onChange={(e) => setFormData({...formData, nome_projeto: e.target.value})}
                      placeholder="Ex: Sistema de Automação RPA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value="Proposta Comercial"
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className={`grid grid-cols-1 gap-4 ${userRole !== 'admin_operacional' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
                  {/* Campos financeiros apenas para admin */}
                  {userRole !== 'admin_operacional' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="percentual_imposto">Impostos (%)</Label>
                        <Input
                          id="percentual_imposto"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.percentual_imposto || ''}
                          onChange={(e) => setFormData({...formData, percentual_imposto: parseFloat(e.target.value) || 0})}
                          placeholder="15.53"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor_hora">Valor Hora (R$)</Label>
                        <Input
                          id="valor_hora"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_hora || ''}
                          onChange={(e) => setFormData({...formData, valor_hora: parseFloat(e.target.value) || 0})}
                          placeholder="100.00"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="percentual_gordura">Percentual de Gordura (%)</Label>
                    <Input
                      id="percentual_gordura"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.percentual_gordura || ''}
                      onChange={(e) => setFormData({...formData, percentual_gordura: parseFloat(e.target.value) || 0})}
                      placeholder="40.0"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Percentual de segurança aplicado sobre o total base
                </p>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Observações adicionais sobre o projeto..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tarefas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Tarefas do Projeto
                  </CardTitle>
                  <Button onClick={addTarefa} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tarefas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tarefa adicionada ainda</p>
                    <p className="text-sm">Clique em "Adicionar Tarefa" para começar</p>
                  </div>
                ) : (
                  <>
                    {/* Cabeçalho da Tabela */}
                    <div className="grid grid-cols-12 gap-2 mb-4 p-3 bg-gray-100 rounded-lg font-medium text-sm">
                      <div className="col-span-3">Funcionalidade</div>
                      <div className="col-span-1 text-center">Qtd</div>
                      <div className="col-span-2">Tecnologia</div>
                      <div className="col-span-1">Complexidade</div>
                      <div className="col-span-1 text-center">Tipo</div>
                      <div className="col-span-1 text-center">Fator</div>
                      <div className="col-span-1 text-center">Total Base</div>
                      <div className="col-span-2 text-center">Com Gordura</div>
                    </div>
                    <div className="space-y-2">
                    {tarefas.map((tarefa, index) => (
                      <TarefaRow
                        key={tarefa.id}
                        tarefa={tarefa}
                        index={index + 1}
                        tecnologias={tecnologias}
                        complexidades={complexidades}
                        tiposTarefa={tiposTarefa}
                        onUpdate={(field, value) => updateTarefa(tarefa.id, field, value)}
                        onRemove={() => removeTarefa(tarefa.id)}
                      />
                    ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Resumo da Estimativa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo da Estimativa
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
                    <span className="text-sm font-medium">Com Gordura ({formData.percentual_gordura}%):</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {totalComGordura.toFixed(1)}h
                  </p>
                </div>

                {/* Valor Hora apenas para admin */}
                {userRole !== 'admin_operacional' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Valor Hora:</span>
                    </div>
                    <p className="text-lg font-semibold">
                      R$ {formData.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                {/* Informações financeiras apenas para admin */}
                {userRole !== 'admin_operacional' && (
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">
                          R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Impostos ({formData.percentual_imposto}%):</span>
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
                )}

                <Button 
                  onClick={handleSave} 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200" 
                  size="lg"
                  disabled={loading || tarefas.length === 0}
                >
                  {loading ? 'Salvando...' : 'Salvar Estimativa'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para cada tarefa
function TarefaRow({ 
  tarefa, 
  index, 
  tecnologias, 
  complexidades, 
  tiposTarefa, 
  onUpdate, 
  onRemove 
}: {
  tarefa: TarefaEstimativa
  index: number
  tecnologias: Tecnologia[]
  complexidades: Complexidade[]
  tiposTarefa: TipoTarefa[]
  onUpdate: (field: keyof TarefaEstimativa, value: any) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-white hover:bg-gray-50">
      {/* Funcionalidade */}
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            #{index}
          </Badge>
          <Input
            value={tarefa.funcionalidade}
            onChange={(e) => onUpdate('funcionalidade', e.target.value)}
            placeholder="Descreva a funcionalidade..."
            className="text-sm"
            maxLength={45}
          />
        </div>
      </div>

      {/* Quantidade */}
      <div className="col-span-1">
        <Input
          type="number"
          min="1"
          value={tarefa.quantidade}
          onChange={(e) => onUpdate('quantidade', parseInt(e.target.value) || 0)}
          className="text-center text-sm"
        />
      </div>

      {/* Tecnologia */}
      <div className="col-span-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between text-sm h-9">
              {tarefa.tecnologia_id ? 
                tecnologias.find(t => t.id === tarefa.tecnologia_id)?.nome || 'Selecionar' : 
                'Selecionar'
              }
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {tecnologias.map(tecnologia => (
              <DropdownMenuItem 
                key={tecnologia.id}
                onClick={() => onUpdate('tecnologia_id', tecnologia.id)}
              >
                {tecnologia.nome}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Complexidade */}
      <div className="col-span-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between text-sm h-9">
              {tarefa.complexidade_id ? 
                complexidades.find(c => c.id === tarefa.complexidade_id)?.nome || 'Selecionar' : 
                'Selecionar'
              }
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {complexidades.map(complexidade => (
              <DropdownMenuItem 
                key={complexidade.id}
                onClick={() => onUpdate('complexidade_id', complexidade.id)}
              >
                {complexidade.nome}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tipo */}
      <div className="col-span-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between text-sm h-9">
              {tarefa.tipo_tarefa_id ? 
                tiposTarefa.find(t => t.id === tarefa.tipo_tarefa_id)?.nome || 'Selecionar' : 
                'Selecionar'
              }
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {tiposTarefa.map(tipo => (
              <DropdownMenuItem 
                key={tipo.id}
                onClick={() => onUpdate('tipo_tarefa_id', tipo.id)}
              >
                {tipo.nome}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-green-600">{tarefa.total_com_gordura.toFixed(1)}h</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NovaEstimativaTarefaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovaEstimativaTarefaContent />
    </Suspense>
  )
}
