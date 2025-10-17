"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Kanban, Users, Calendar, Clock, Building2, MoreHorizontal, GripVertical } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
  useDroppable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  start_date?: string
  end_date?: string
  budget?: number
  companies?: {
    name: string
  }
  technical_responsible?: string
  key_user?: string
  project_type?: string
}

interface Task {
  id: string
  name: string
  description?: string
  status: string
  responsible?: string
  start_date?: string
  end_date?: string
  delay_justification?: string
  original_end_date?: string
  actual_end_date?: string
}

// Componente para tarefas arrastáveis
function DraggableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-slate-100 text-slate-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'on_hold': return 'bg-yellow-100 text-yellow-700'
      case 'delayed': return 'bg-red-100 text-red-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'completed_delayed': return 'bg-orange-100 text-orange-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Não Iniciado'
      case 'in_progress': return 'Em Andamento'
      case 'on_hold': return 'Pausado'
      case 'delayed': return 'Atrasado'
      case 'completed': return 'Concluído'
      case 'completed_delayed': return 'Concluído com Atraso'
      default: return 'Não Iniciado'
    }
  }

  const hasDelayJustification = task.delay_justification && task.status === 'completed_delayed'

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-300 border border-slate-200/60 bg-white shadow-md hover:shadow-xl hover:shadow-blue-500/15 hover:scale-[1.02] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/20 ${
        isDragging ? 'rotate-2 scale-105 shadow-2xl border-blue-400 border-2 z-50' : ''
      } ${hasDelayJustification ? 'bg-orange-50 border-orange-200' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header da task */}
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
              {task.name}
            </h4>
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status).replace('text-', 'bg-').replace('-100', '-400')} shadow-sm`} />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Indicador de drag */}
          <div 
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-grab"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
          </div>
          
          {/* Descrição */}
          {task.description && (
            <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200">
              {task.description}
            </p>
          )}
          
          {/* Responsável */}
          {task.responsible && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <Users className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="font-medium">{task.responsible}</span>
            </div>
          )}
          
          {/* Datas */}
          {task.start_date && task.end_date && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <Calendar className="h-3 w-3 text-slate-500 flex-shrink-0" />
              <span className="font-medium">
                {new Date(task.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} - {new Date(task.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          
          {/* Justificativa de atraso */}
          {hasDelayJustification && (
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-3 border-2 border-orange-300">
              <div className="flex items-start gap-2 mb-2">
                <Clock className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-orange-800">Justificativa de Atraso</span>
              </div>
              <p className="text-orange-800 text-xs line-clamp-3 leading-relaxed font-medium">{task.delay_justification}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para colunas dropáveis
function DroppableColumn({ column, tasks }: { column: any; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const getColumnBorder = (columnId: string) => {
    switch (columnId) {
      case 'not_started': return 'border-slate-300'
      case 'in_progress': return 'border-blue-300'
      case 'on_hold': return 'border-yellow-300'
      case 'delayed': return 'border-red-300'
      case 'completed': return 'border-green-300'
      case 'completed_delayed': return 'border-orange-300'
      default: return 'border-slate-300'
    }
  }

  const getColumnAccent = (columnId: string) => {
    switch (columnId) {
      case 'not_started': return 'bg-slate-400'
      case 'in_progress': return 'bg-blue-400'
      case 'on_hold': return 'bg-yellow-400'
      case 'delayed': return 'bg-red-400'
      case 'completed': return 'bg-green-400'
      case 'completed_delayed': return 'bg-orange-400'
      default: return 'bg-slate-400'
    }
  }

  const taskCount = tasks.length

  return (
    <div 
      ref={setNodeRef}
      className={`relative group rounded-2xl border-2 border-dashed ${getColumnBorder(column.id)} bg-white/50 backdrop-blur-sm p-5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-solid group-hover:bg-white/80 ${
        isOver ? 'bg-blue-50/80 border-blue-400' : ''
      }`}
    >
      {/* Barra superior colorida */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${getColumnAccent(column.id)} opacity-60`} />
      
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-slate-800">{column.title}</h3>
          <span className="text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/60 min-w-[32px] text-center">
            {taskCount}
          </span>
        </div>
      </div>

      {/* Área de tarefas */}
      <div className="space-y-4 min-h-[300px]">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {/* Placeholder para colunas vazias */}
        {taskCount === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 mx-auto mb-2 flex items-center justify-center">
                <Kanban className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Nenhuma tarefa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FlowTasksBoardPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
      fetchTasks()
    }
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          priority,
          start_date,
          end_date,
          budget,
          technical_responsible,
          key_user,
          project_type,
          companies (
            name
          )
        `)
        .eq("id", projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error("Erro ao buscar projeto:", error)
      setError("Erro ao carregar projeto")
    }
  }

  const fetchTasks = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          name,
          description,
          status,
          responsible,
          start_date,
          end_date,
          delay_justification,
          original_end_date,
          actual_end_date
        `)
        .eq("project_id", projectId)
        .order("created_at")

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Erro ao buscar tasks:", error)
      setError("Erro ao carregar tasks")
    } finally {
      setLoading(false)
    }
  }

  // Função para lidar com drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    console.log('🚀 DRAG START:', event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 DRAG END:', event)
    setActiveId(null)
    
    const { active, over } = event
    
    if (!over) {
      console.log('❌ Sem destino válido')
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string
    const currentTask = tasks.find(task => task.id === taskId)
    
    if (!currentTask || currentTask.status === newStatus) {
      console.log('❌ Task não encontrada ou mesmo status')
      return
    }

    console.log(`🔄 Movendo task ${taskId} de ${currentTask.status} para ${newStatus}`)

    // Atualizar estado local imediatamente (otimistic update)
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )

    // Sincronizar com o banco de dados
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (updateError) {
        console.error('❌ Erro ao atualizar task:', updateError)
        // Reverter mudança local se falhar
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: currentTask.status } : task
          )
        )
        alert('Erro ao atualizar tarefa. Tente novamente.')
      } else {
        console.log('✅ Task atualizada com sucesso:', taskId, '→', newStatus)
      }
    } catch (error) {
      console.error('❌ Erro de sincronização:', error)
      // Reverter mudança local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: currentTask.status } : task
        )
      )
      alert('Erro ao sincronizar com o servidor.')
    }
  }

  // Agrupar tarefas por status
  const tasksByStatus = {
    not_started: tasks.filter(task => task.status === 'not_started'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    on_hold: tasks.filter(task => task.status === 'on_hold'),
    delayed: tasks.filter(task => task.status === 'delayed'),
    completed: tasks.filter(task => task.status === 'completed'),
    completed_delayed: tasks.filter(task => task.status === 'completed_delayed'),
  }

  // Colunas do Kanban
  const columns = [
    { id: 'not_started', title: 'Não Iniciado' },
    { id: 'in_progress', title: 'Em Andamento' },
    { id: 'on_hold', title: 'Pausado' },
    { id: 'delayed', title: 'Atrasado' },
    { id: 'completed', title: 'Concluído' },
    { id: 'completed_delayed', title: 'Concluído com Atraso' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando FlowTasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Kanban className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-slate-400 mb-4">
            <Kanban className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Projeto não encontrado</h2>
          <p className="text-slate-600 mb-4">O projeto solicitado não existe ou você não tem permissão para acessá-lo.</p>
          <Link href="/admin/flowtasks">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para projetos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header moderno */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-lg">
            {/* Decorações de fundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-blue-100/20" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-200/20 rounded-full blur-3xl" />
            
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Kanban className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {project.name}
                      </h1>
                      <p className="text-slate-600 text-sm mt-1">
                        {project.companies?.name} • {tasks.length} tarefas
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href="/admin/projects">
                  <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Board Kanban com Drag & Drop */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="relative">
              {/* Background decorativo para o board */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-slate-50/30 to-gray-50/20 rounded-3xl blur-3xl opacity-40" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-6">
                {columns.map((column) => (
                  <DroppableColumn 
                    key={column.id} 
                    column={column} 
                    tasks={tasksByStatus[column.id as keyof typeof tasksByStatus]} 
                  />
                ))}
              </div>
            </div>
          </DndContext>

          {/* Estado vazio */}
          {tasks.length === 0 && (
            <div className="text-center py-16">
              <div className="relative">
                {/* Decorações de fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-cyan-100/10 to-indigo-100/20 rounded-3xl blur-2xl" />
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-200/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-200/10 rounded-full blur-2xl" />
                
                <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 p-12 shadow-xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Kanban className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Nenhuma tarefa encontrada</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Este projeto ainda não possui tarefas cadastradas. Acesse o cronograma para criar as primeiras tarefas.
                  </p>
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      Ir para Cronograma
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
