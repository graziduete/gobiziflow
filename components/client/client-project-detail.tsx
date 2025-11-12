"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GanttChart } from "@/components/admin/gantt-chart"
import { TaskMetricsCard } from "@/components/admin/task-metrics-card"
import { ProjectDocsList } from "@/components/client/project-docs-list"
import { createClient } from "@/lib/supabase/client"

// ID da Copersucar para exibir campo Safra
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  project_type: string | null
  start_date: string | null
  end_date: string | null
  predicted_start_date?: string | null
  predicted_end_date?: string | null
  actual_start_date?: string | null
  actual_end_date?: string | null
  budget: number | null
  estimated_hours: number | null
  consumed_hours: number | null
  created_at: string
  company_id: string
  safra?: string | null
  companies?: {
    id: string
    name: string
    logo_url: string | null
    has_hour_package: boolean
    contracted_hours: number | null
  } | null
  profiles?: {
    full_name: string
  } | null
}



interface ClientProjectDetailProps {
  project: Project
}

export function ClientProjectDetail({ project }: ClientProjectDetailProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [project.id])

  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true)
      setTasksError(null)
      
      console.log("🔍 [fetchTasks] Buscando tarefas para projeto:", project.id)
      
      const supabase = createClient()
      
      // Buscar tarefas do projeto
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          responsible,
          delay_justification,
          original_end_date,
          actual_start_date,
          actual_end_date,
          predicted_end_date,
          delay_created_at,
          delay_created_by,
          order
        `)
        .eq("project_id", project.id)
        .order("order", { nullsFirst: false })
        .order("created_at")

      console.log("📊 [fetchTasks] Resultado da query:", { tasksData, tasksError })

      if (tasksError) throw tasksError

      // Utilitário para formatar data para YYYY-MM-DD sem fuso
      const toISODate = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        return d.toISOString().slice(0, 10)
      }

      // Transformar dados para o formato esperado pelo GanttChart e Métricas
      const formattedTasks = (tasksData || [])
        .map((task: any) => ({
          id: task.id,
          name: task.name,
          start_date: task.start_date,
          end_date: task.end_date,
          status: task.status,
          responsible: task.responsible || '—',
          description: task.description || '',
          delay_justification: task.delay_justification,
          original_end_date: task.original_end_date,
          actual_start_date: task.actual_start_date,
          actual_end_date: task.actual_end_date,
          predicted_end_date: task.predicted_end_date,
          delay_created_at: task.delay_created_at,
          delay_created_by: task.delay_created_by
        }))

      console.log("🧩 [fetchTasks] Tarefas formatadas: ", formattedTasks)
      setTasks(formattedTasks)
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
      setTasksError(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsLoadingTasks(false)
    }
  }





  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-gradient-to-r from-slate-500 to-gray-600 text-white font-semibold shadow-sm"
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-sm"
      case "homologation":
        return "bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-sm"
      case "on_hold":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold shadow-sm"
      case "delayed":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-sm"
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-sm"
      case "cancelled":
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white font-semibold shadow-sm"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "planning":
        return "Planejamento"
      case "in_progress":
        return "Em Andamento"
      case "homologation":
        return "Homologação"
      case "on_hold":
        return "Pausado"
      case "delayed":
        return "Atrasado"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return "Planejamento"
    }
  }

  const getProjectTypeText = (projectType: string) => {
    const types: { [key: string]: string } = {
      "automation": "Automação de Processos (RPA ou Script de Automação)",
      "data_analytics": "Data & Analytics",
      "digital_development": "Desenvolvimento Digital (App / Web)",
      "design": "Design",
      "consulting": "Consultoria",
      "project_management": "Gestão de Projetos/PMO",
      "system_integration": "Integração de Sistemas / APIs",
      "infrastructure": "Infraestrutura/Cloud",
      "support": "Suporte / Sustentação",
      "training": "Treinamento / Capacitação"
    }
    return types[projectType] || projectType
  }

  return (
    <>
      {/* Informações do Projeto - Card Único */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <Badge className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Prioridade</h4>
              <Badge className={
                project.priority === 'urgent' 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-sm'
                  : project.priority === 'high'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold shadow-sm'
                  : project.priority === 'medium'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-gradient-to-r from-slate-500 to-gray-600 text-white font-semibold shadow-sm'
              }>
                {project.priority === 'urgent' ? 'Urgente' : project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-sm">
                {getProjectTypeText(project.project_type || '')}
              </Badge>
            </div>

            {/* Cronologia do Projeto */}
            <div className="space-y-3 md:col-span-2 lg:col-span-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">📅 Cronologia do Projeto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PLANEJADO (Baseline) */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <span className="text-xs font-semibold text-slate-700 uppercase">Planejado (Baseline)</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <span className="ml-2 font-medium">{project.start_date ? new Date(project.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Término:</span>
                      <span className="ml-2 font-medium">{project.end_date ? new Date(project.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                    </div>
                    {project.start_date && project.end_date && (
                      <div className="text-xs text-slate-500 mt-1">
                        Duração: {Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (24 * 60 * 60 * 1000))} dias
                      </div>
                    )}
                  </div>
                </div>

                {/* PREVISÃO ATUAL */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span className="text-xs font-semibold text-blue-700 uppercase">Previsão Atual</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <span className="ml-2 font-medium">{project.predicted_start_date ? new Date(project.predicted_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : (project.start_date ? new Date(project.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Término:</span>
                      <span className="ml-2 font-medium">{project.predicted_end_date ? new Date(project.predicted_end_date + 'T12:00:00').toLocaleDateString('pt-BR') : (project.end_date ? new Date(project.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—')}</span>
                    </div>
                    {project.end_date && (project.predicted_end_date || project.end_date) && (
                      <div className="text-xs mt-1">
                        {(() => {
                          const planned = new Date(project.end_date)
                          const predicted = new Date(project.predicted_end_date || project.end_date)
                          const deviation = Math.ceil((predicted.getTime() - planned.getTime()) / (24 * 60 * 60 * 1000))
                          
                          if (deviation > 0) {
                            return <span className="text-orange-600 font-medium">⚠️ +{deviation} dias após o planejado</span>
                          } else if (deviation < 0) {
                            return <span className="text-green-600 font-medium">✓ {Math.abs(deviation)} dias antes do planejado</span>
                          } else {
                            return <span className="text-slate-600">No prazo</span>
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* REALIZADO */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase">Realizado</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <span className="ml-2 font-medium">
                        {project.actual_start_date ? (
                          <>{new Date(project.actual_start_date + 'T12:00:00').toLocaleDateString('pt-BR')} ✓</>
                        ) : (
                          <span className="text-slate-400">Aguardando início</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Término:</span>
                      <span className="ml-2 font-medium">
                        {project.actual_end_date ? (
                          <>{new Date(project.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR')} ✓</>
                        ) : (
                          <span className="text-blue-600 font-medium">Em conclusão...</span>
                        )}
                      </span>
                    </div>
                    {project.actual_start_date && !project.actual_end_date && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Executado: {Math.ceil((new Date().getTime() - new Date(project.actual_start_date).getTime()) / (24 * 60 * 60 * 1000))} dias até hoje
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Orçamento */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Orçamento</h4>
              <div className="text-lg font-semibold">
                {project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : 'Não definido'}
              </div>
            </div>

            {/* Safra - apenas para Copersucar */}
            {project.company_id === COPERSUCAR_ID && project.safra && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Safra</h4>
                <div className="text-lg font-semibold text-purple-700">
                  {project.safra}
                </div>
              </div>
            )}

            {/* Horas Estimadas */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Horas Estimadas</h4>
              <div className="text-lg font-semibold">
                {project.estimated_hours ? `${project.estimated_hours}h` : 'Não definido'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Métricas de Desempenho */}
      {!isLoadingTasks && tasks.length > 0 && <TaskMetricsCard tasks={tasks} />}

      {/* Cronograma do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cronograma do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
              </div>
            </div>
          ) : tasksError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Erro ao carregar tarefas: {tasksError}</p>
              <button 
                onClick={fetchTasks}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma tarefa cadastrada para este projeto</p>
            </div>
          ) : (
            <GanttChart 
              tasks={tasks.filter((t: any) => !!t.start_date && !!t.end_date)}
              projectStartDate={project.start_date || undefined}
              projectEndDate={project.end_date || undefined}
              projectName={project.name}
            />
          )}
        </CardContent>
      </Card>

      {/* Documentos do Projeto (somente visualização/baixa) */}
      <ProjectDocsList projectId={project.id} />
    </>
  )
}