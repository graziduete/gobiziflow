"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DelayJustificationModal } from "@/components/admin/delay-justification-modal"
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
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
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
    opacity: isDragging ? 0.9 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 99999 : 'auto',
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
      {...attributes}
      {...listeners}
      className={`relative transition-all duration-300 border border-slate-200/60 bg-white shadow-md hover:shadow-xl hover:shadow-blue-500/15 hover:scale-[1.02] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/20 ${
        isDragging ? 'rotate-3 scale-110 shadow-2xl shadow-blue-500/30 border-blue-500 border-2' : ''
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
      className={`relative group rounded-3xl border-2 border-dashed ${getColumnBorder(column.id)} bg-white/60 backdrop-blur-md p-6 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-solid group-hover:bg-white/90 hover:-translate-y-1 ${
        isOver ? 'bg-blue-50/90 border-blue-400 scale-105 shadow-2xl shadow-blue-500/20' : ''
      }`}
    >
      {/* Barra superior colorida moderna */}
      <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-3xl ${getColumnAccent(column.id)} opacity-70`} />
      
      {/* Decoração de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl opacity-50" />
      
      {/* Header da coluna modernizado */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getColumnAccent(column.id)} shadow-lg`} />
            <h3 className="font-bold text-lg text-slate-800 drop-shadow-sm">{column.title}</h3>
          </div>
          <div className="relative">
            <span className="text-xs font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/70 min-w-[40px] text-center ring-1 ring-slate-200/50">
              {taskCount}
            </span>
            {taskCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Área de tarefas */}
      <div className="space-y-4 min-h-[300px]">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {/* Placeholder modernizado para colunas vazias */}
        {taskCount === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-300/50 rounded-2xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 backdrop-blur-sm group-hover:border-slate-400/60 transition-all duration-300">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 mx-auto mb-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Kanban className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Nenhuma tarefa</p>
              <p className="text-xs text-slate-400 mt-1">Arraste uma tarefa aqui</p>
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
  
  // Estados para modal de justificativa
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)


  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requer 8px de movimento para iniciar drag
      },
    }),
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
    console.log('🎯 DRAG END EVENT COMPLETO:', event)
    setActiveId(null)
    
    const { active, over } = event
    
    console.log('🎯 ACTIVE:', active)
    console.log('🎯 OVER:', over)
    
    if (!over) {
      console.log('❌ Sem destino válido')
      return
    }

    const taskId = active.id as string
    const overId = over.id as string
    const currentTask = tasks.find(task => task.id === taskId)
    
    console.log('🎯 DADOS EXTRAÍDOS:')
    console.log('  - taskId:', taskId)
    console.log('  - overId:', overId)
    console.log('  - currentTask:', currentTask)
    console.log('  - currentTask.status:', currentTask?.status)
    
    // Verificar se o overId é uma task (UUID) ou uma coluna (status)
    let newStatus: string
    
    // Se overId é uma task existente, usar o status dessa task
    const overTask = tasks.find(task => task.id === overId)
    if (overTask) {
      console.log('🎯 DROP EM CIMA DE OUTRA TASK:', overTask.name, 'Status:', overTask.status)
      newStatus = overTask.status
    } else {
      // Se overId é uma coluna (status)
      console.log('🎯 DROP EM COLUNA:', overId)
      newStatus = overId
    }
    
    console.log('🎯 STATUS FINAL CALCULADO:', newStatus)
    
    if (!currentTask || currentTask.status === newStatus) {
      console.log('❌ Task não encontrada ou mesmo status')
      return
    }

    console.log(`🔄 Movendo task ${taskId} de ${currentTask.status} para ${newStatus}`)
    
    // Lógica especial para "Concluído com Atraso"
    if (newStatus === 'completed_delayed') {
      console.log('🚨 TENTATIVA DE MUDANÇA PARA "Concluído com Atraso"')
      console.log('  - Abrindo modal de justificativa...')
      
      // Abrir modal de justificativa
      setSelectedTask(currentTask)
      setShowDelayModal(true)
      
      // NÃO fazer a mudança ainda - aguardar justificativa
      console.log('⏳ Aguardando justificativa antes de atualizar status')
      return
    }

    // Atualizar estado local imediatamente (otimistic update)
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )

    // Sincronizar com o banco de dados
    try {
      const supabase = createClient()
      
      // Verificar usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 Usuário atual:', { user: user?.id, userError })
      
      console.log('🔄 Atualizando task:', { taskId, newStatus })
      
      // Primeiro, verificar se a task existe e qual o status atual
      const { data: existingTask, error: fetchError } = await supabase
        .from('tasks')
        .select('id, status, name')
        .eq('id', taskId)
        .single()
      
      console.log('🔍 Task existente:', { existingTask, fetchError })
      
      if (fetchError) {
        console.error('❌ Erro ao buscar task:', fetchError)
        throw new Error(`Erro ao buscar task: ${fetchError.message}`)
      }
      
      if (!existingTask) {
        throw new Error('Task não encontrada no banco de dados')
      }
      
      // Tentar atualizar
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()

      console.log('📊 Resultado da atualização:', { data, updateError })

      if (updateError) {
        console.error('❌ Erro detalhado ao atualizar task:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        
        // Debug específico para problemas de permissão
        if (updateError.message?.includes('permission') || updateError.message?.includes('RLS')) {
          console.error('🚨 PROBLEMA DE PERMISSÃO/RLS DETECTADO!')
          console.error('📋 Dados da tentativa:', {
            taskId,
            currentStatus: existingTask?.status,
            newStatus,
            taskName: existingTask?.name
          })
        }
        // Reverter mudança local se falhar
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: currentTask.status } : task
          )
        )
        alert(`Erro ao atualizar tarefa: ${updateError.message}`)
      } else {
        console.log('✅ Task atualizada com sucesso:', taskId, '→', newStatus)
        console.log('📊 Dados retornados:', data)
      }
    } catch (error) {
      console.error('❌ Erro de sincronização:', error)
      // Reverter mudança local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: currentTask.status } : task
        )
      )
      alert(`Erro ao sincronizar: ${error}`)
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
          {/* Animação de raio moderna */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                className="animate-pulse"
                style={{
                  stroke: 'url(#lightning-gradient-flowtasks)',
                  strokeWidth: 0.5,
                  fill: 'url(#lightning-gradient-flowtasks)',
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.9))'
                }}
              />
              <defs>
                <linearGradient id="lightning-gradient-flowtasks" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Carregando FlowTasks...</p>
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
      <style jsx global>{`
        /* Estilos para drag & drop com @dnd-kit */
        [data-rbd-drag-handle-dragging] {
          transform: rotate(3deg) scale(1.05) !important;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3) !important;
          background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
          border: 2px solid #3b82f6 !important;
          z-index: 99999 !important;
          opacity: 0.95 !important;
          filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4)) !important;
          position: relative !important;
        }
        
        [data-rbd-drag-handle-dragging] * {
          pointer-events: none !important;
        }

        /* Estilos específicos para @dnd-kit */
        [data-sortable-id] {
          transition: all 0.2s ease;
        }
        
        [data-sortable-id][data-sortable-overlay] {
          z-index: 99999 !important;
          position: relative !important;
        }

        /* Animação de pulso durante o drag */
        @keyframes dragPulse {
          0%, 100% { transform: rotate(3deg) scale(1.05); }
          50% { transform: rotate(-2deg) scale(1.08); }
        }
        
        [data-rbd-drag-handle-dragging] {
          animation: dragPulse 0.6s ease-in-out infinite !important;
        }
      `}</style>
      <div className="container mx-auto px-6 py-8 max-w-none">
        <div className="space-y-6">
          {/* Header ultra moderno */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl">
            {/* Decorações de fundo sofisticadas */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/10" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full blur-3xl" />
            
            {/* Grid pattern sutil */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center gap-6">
                {/* Botão voltar seguindo padrão dos outros headers */}
                <Link href="/admin/projects" className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white hover:text-white transition-all duration-300 group">
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
                </Link>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <Kanban className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">{project.name}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-blue-100">
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <Building2 className="h-4 w-4 text-blue-300" />
                        <span className="font-medium">{project.companies?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                        <span className="font-medium">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <Clock className="h-4 w-4 text-blue-300" />
                        <span className="font-medium">Kanban Board</span>
                      </div>
                    </div>
                  </div>
                </div>
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
              {/* Background decorativo ultra moderno */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl" />
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl" />
              
              {/* Grid pattern sutil */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23e2e8f0%22%20fill-opacity%3D%220.1%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22m0%2040l40-40h-40v40zm40%200v-40h-40l40%2040z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
              
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-6">
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

          {/* Estado vazio ultra moderno */}
          {tasks.length === 0 && (
            <div className="text-center py-20">
              <div className="relative max-w-2xl mx-auto">
                {/* Decorações de fundo sofisticadas */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100/30 via-blue-50/20 to-cyan-50/30 rounded-3xl blur-3xl" />
                <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
                
                <div className="relative bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 p-12 shadow-2xl">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <Kanban className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 drop-shadow-sm">Nenhuma tarefa encontrada</h3>
                  <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                    Este projeto ainda não possui tarefas cadastradas. Acesse o cronograma para criar as primeiras tarefas e começar a usar o FlowTasks.
                  </p>
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg font-semibold">
                      <Kanban className="h-5 w-5 mr-2" />
                      Ir para Cronograma
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Justificativa de Atraso */}
      {selectedTask && selectedTask.end_date && (
        <DelayJustificationModal
          task={{
            id: selectedTask.id,
            name: selectedTask.name,
            end_date: selectedTask.end_date
          }}
          isOpen={showDelayModal}
          onClose={() => {
            setShowDelayModal(false)
            setSelectedTask(null)
          }}
          onSuccess={() => {
            console.log('✅ Justificativa salva com sucesso!')
            // Recarregar tasks para refletir as mudanças
            fetchTasks()
            setShowDelayModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
