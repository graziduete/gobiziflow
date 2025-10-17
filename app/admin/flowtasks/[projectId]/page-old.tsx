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
  DragOverEvent,
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
          companies!inner(
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
  const handleDragEnd = async (result: DropResult) => {
    console.log('🎯 DRAG END RESULT:', result)
    
    if (!result.destination) {
      console.log('❌ Sem destino válido')
      return // Item foi solto fora de uma área válida
    }

    const { source, destination, draggableId } = result
    
    // Se foi movido para a mesma posição, não faz nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const newStatus = destination.droppableId
    const taskId = draggableId

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
        console.error('Erro ao atualizar task:', updateError)
        // Reverter mudança local se falhar
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: source.droppableId } : task
          )
        )
        alert('Erro ao atualizar tarefa. Tente novamente.')
      } else {
        console.log('✅ Task atualizada com sucesso:', taskId, '→', newStatus)
      }
    } catch (error) {
      console.error('Erro de sincronização:', error)
      // Reverter mudança local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: source.droppableId } : task
        )
      )
      alert('Erro de conexão. Tente novamente.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed_delayed":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "completed_delayed":
        return "Concluído com Atraso"
      case "in_progress":
        return "Em Andamento"
      case "not_started":
        return "Não Iniciado"
      case "delayed":
        return "Atrasado"
      case "on_hold":
        return "Pausado"
      default:
        return "Não Iniciado"
    }
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "completed_delayed":
        return "Concluído com Atraso"
      case "in_progress":
        return "Em Andamento"
      case "not_started":
        return "Não Iniciado"
      case "delayed":
        return "Atrasado"
      case "on_hold":
        return "Pausado"
      default:
        return "Não Iniciado"
    }
  }

  const getProjectTypeText = (type?: string) => {
    const types: { [key: string]: string } = {
      automation: "Automação",
      data_analytics: "Data & Analytics",
      digital_development: "Desenvolvimento Digital",
      design: "Design",
      consulting: "Consultoria",
      project_management: "Gestão de Projetos",
      system_integration: "Integração de Sistemas",
      infrastructure: "Infraestrutura",
      support: "Suporte",
      training: "Treinamento"
    }
    return type ? types[type] || type : "Não definido"
  }

  // Organizar tasks por status
  const tasksByStatus = {
    not_started: tasks.filter(task => task.status === "not_started"),
    in_progress: tasks.filter(task => task.status === "in_progress"),
    on_hold: tasks.filter(task => task.status === "on_hold"),
    delayed: tasks.filter(task => task.status === "delayed"),
    completed: tasks.filter(task => task.status === "completed"),
    completed_delayed: tasks.filter(task => task.status === "completed_delayed")
  }

  const columns = [
    { id: "not_started", title: "Não Iniciado", color: "bg-gray-50 border-gray-200" },
    { id: "in_progress", title: "Em Andamento", color: "bg-blue-50 border-blue-200" },
    { id: "on_hold", title: "Pausado", color: "bg-yellow-50 border-yellow-200" },
    { id: "delayed", title: "Atrasado", color: "bg-red-50 border-red-200" },
    { id: "completed", title: "Concluído", color: "bg-green-50 border-green-200" },
    { id: "completed_delayed", title: "Concluído com Atraso", color: "bg-orange-50 border-orange-200" }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando board Kanban...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Kanban className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Erro ao carregar projeto</h2>
          <p className="text-gray-600 mt-2">{error || "Projeto não encontrado"}</p>
        </div>
        <Link href="/admin/flowtasks">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para FlowTasks
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Estilos customizados para drag & drop */}
      <style jsx global>{`
        [data-rbd-draggable-context-id] {
          transform: none !important;
        }
        
        [data-rbd-drag-handle-context-id] {
          cursor: grab;
          transition: all 0.2s ease;
        }
        
        [data-rbd-drag-handle-context-id]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.3) !important;
        }
        
        [data-rbd-drag-handle-context-id]:active {
          cursor: grabbing;
        }
        
        /* Estilos para elementos sendo arrastados */
        [data-rbd-drag-handle-context-id][data-rbd-drag-handle-dragging] {
          /* Remover transformações conflitantes */
          transform: none !important;
        }
        
        [data-rbd-draggable-id][data-rbd-draggable-context-id] {
          transition: all 0.2s ease;
        }
        
        
        [data-rbd-droppable-id][data-rbd-droppable-context-id][data-rbd-droppable-dragging-over] {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: rgb(59, 130, 246) !important;
          border-style: solid !important;
        }
        
        /* Estilo para indicar que o card pode ser arrastado */
        [data-rbd-drag-handle-context-id]:hover [data-rbd-draggable-id] {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1)) !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        
        /* Garantir que o primeiro card tenha precedência sobre a coluna */
        [data-rbd-draggable-context-id] {
          position: relative !important;
          z-index: 10 !important;
        }
        
        [data-rbd-draggable-context-id]:first-child {
          z-index: 20 !important;
        }
        
        /* Prevenir que o hover da coluna interfira nos cards */
        [data-rbd-droppable-context-id] {
          pointer-events: none !important;
        }
        
        [data-rbd-draggable-context-id] {
          pointer-events: auto !important;
        }
        
        /* Remover pointer events dos elementos filhos durante o drag */
        [data-rbd-drag-handle-context-id][data-rbd-drag-handle-dragging] * {
          pointer-events: none !important;
        }
      `}</style>
      
      <div className="space-y-6">
      {/* Header moderno */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-lg">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        
        {/* Círculo decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl" />
        
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/flowtasks">
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Kanban className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {project.name}
                  </h1>
                  <p className="text-slate-600 mt-1 text-lg font-medium">
                    Board Kanban - {project.companies?.name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-slate-600">tarefas totais</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Projeto - Modernizado */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl border border-blue-100/50 shadow-lg">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        
        {/* Círculo decorativo */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-xl" />
        
        <div className="relative p-6">
          {/* Header moderno */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Informações do Projeto
              </h3>
              <p className="text-sm text-slate-600">Detalhes e configurações</p>
            </div>
          </div>

          {/* Grid de informações modernizado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="group">
              <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors duration-300">
                  <Building2 className="h-4 w-4 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</p>
                  <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-300">
                    {getProjectTypeText(project.project_type)}
                  </p>
                </div>
              </div>
            </div>

            {project.start_date && (
              <div className="group">
                <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-green-100 transition-colors duration-300">
                    <Calendar className="h-4 w-4 text-slate-600 group-hover:text-green-600 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Início</p>
                    <p className="font-bold text-slate-900 group-hover:text-green-700 transition-colors duration-300">
                      {new Date(project.start_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="group">
                <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-red-100 transition-colors duration-300">
                    <Clock className="h-4 w-4 text-slate-600 group-hover:text-red-600 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fim</p>
                    <p className="font-bold text-slate-900 group-hover:text-red-700 transition-colors duration-300">
                      {new Date(project.end_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {project.technical_responsible && (
              <div className="group">
                <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 hover:shadow-md transition-all duration-300">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-purple-100 transition-colors duration-300">
                    <Users className="h-4 w-4 text-slate-600 group-hover:text-purple-600 transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsável</p>
                    <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors duration-300">
                      {project.technical_responsible}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Descrição moderna */}
          {project.description && (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-200 rounded-lg">
                  <div className="w-3 h-3 bg-slate-600 rounded-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descrição</p>
                  <p className="text-slate-700 leading-relaxed font-medium">{project.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board Kanban Modernizado com Drag & Drop */}
      <DragDropContext 
        onDragStart={(start) => console.log('🚀 DRAG START:', start)}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          {/* Background decorativo para o board */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-slate-50/30 to-gray-50/20 rounded-3xl blur-3xl opacity-40" />
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-6">
          {columns.map((column) => {
            const taskCount = tasksByStatus[column.id as keyof typeof tasksByStatus].length
            const getColumnBorder = (id: string) => {
              switch (id) {
                case 'not_started': return 'border-slate-300'
                case 'in_progress': return 'border-blue-300'
                case 'on_hold': return 'border-yellow-300'
                case 'delayed': return 'border-red-300'
                case 'completed': return 'border-green-300'
                case 'completed_delayed': return 'border-orange-300'
                default: return 'border-slate-300'
              }
            }
            
            const getColumnAccent = (id: string) => {
              switch (id) {
                case 'not_started': return 'bg-slate-500'
                case 'in_progress': return 'bg-blue-500'
                case 'on_hold': return 'bg-yellow-500'
                case 'delayed': return 'bg-red-500'
                case 'completed': return 'bg-green-500'
                case 'completed_delayed': return 'bg-orange-500'
                default: return 'bg-slate-500'
              }
            }

            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="relative group"
                  >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    
                    <div className={`relative rounded-2xl border-2 border-dashed ${getColumnBorder(column.id)} bg-white/50 backdrop-blur-sm p-5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-solid group-hover:bg-white/80 ${
                      snapshot.isDraggingOver ? 'bg-blue-50/80 border-blue-400' : ''
                    }`}>
                  {/* Barra superior colorida */}
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${getColumnAccent(column.id)} opacity-60`} />
                  
                  {/* Header da coluna */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/80 shadow-sm border border-white/50`}>
                        <div className={`w-3 h-3 rounded-full ${getColumnAccent(column.id)} shadow-sm`} />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors duration-300">
                        {column.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/60 min-w-[32px] text-center">
                        {taskCount}
                      </span>
                    </div>
                  </div>

                  {/* Área de tarefas */}
                  <div className="space-y-4 min-h-[300px]">
                    {tasksByStatus[column.id as keyof typeof tasksByStatus].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => {
                          // Debug: verificar se o dragging está funcionando
                          if (snapshot.isDragging) {
                            console.log('🎯 CARD SENDO ARRASTADO:', task.name);
                          }
                          return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="group/task relative z-10"
                            style={{
                              transform: snapshot.isDragging ? 'rotate(3deg) scale(1.1)' : 'none',
                              boxShadow: snapshot.isDragging ? '0 35px 60px -12px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.3)' : 'none',
                              border: snapshot.isDragging ? '3px solid rgb(59, 130, 246)' : 'none',
                              zIndex: snapshot.isDragging ? 99999 : 'auto',
                              opacity: snapshot.isDragging ? 1 : 'auto',
                              filter: snapshot.isDragging ? 'brightness(1.1) contrast(1.1)' : 'none',
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Efeito de brilho sutil no card */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-xl opacity-0 group-hover/task:opacity-100 transition-opacity duration-300 blur-sm" />
                            
                            <Card 
                              className={`relative transition-all duration-300 border border-slate-200/60 bg-white shadow-md hover:shadow-xl hover:shadow-blue-500/15 hover:scale-[1.02] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/20`}>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header da task */}
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover/task:text-blue-700 transition-colors duration-300 leading-tight">
                                  {task.name}
                                </h4>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${getColumnAccent(column.id)} shadow-sm`} />
                                  <div className="opacity-0 group-hover/task:opacity-100 transition-opacity duration-300">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Indicador de drag */}
                              <div className="absolute top-2 left-2 opacity-0 group-hover/task:opacity-100 transition-opacity duration-300">
                                <GripVertical className="h-4 w-4 text-slate-400" />
                              </div>
                              
                              {/* Descrição */}
                              {task.description && (
                                <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  {task.description}
                                </p>
                              )}

                              {/* Informações da task */}
                              <div className="space-y-2">
                                {task.responsible && (
                                  <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                      <Users className="h-3 w-3 text-blue-700" />
                                    </div>
                                    <span className="text-xs text-blue-800 font-semibold">{task.responsible}</span>
                                  </div>
                                )}

                                {task.start_date && task.end_date && (
                                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <div className="p-1.5 bg-slate-200 rounded-lg">
                                      <Calendar className="h-3 w-3 text-slate-700" />
                                    </div>
                                    <span className="text-xs text-slate-800 font-medium">
                                      {new Date(task.start_date).toLocaleDateString("pt-BR")} - {new Date(task.end_date).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Justificativa de atraso */}
                              {task.status === "completed_delayed" && task.delay_justification && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl border-2 border-orange-300 shadow-md">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                                    <p className="text-orange-900 font-bold text-xs">Justificativa:</p>
                                  </div>
                                  <p className="text-orange-800 text-xs line-clamp-3 leading-relaxed font-medium">{task.delay_justification}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                          );
                        }}
                      </Draggable>
                    ))}
                    
                    {/* Placeholder para colunas vazias */}
                    {taskCount === 0 && (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <div className="w-4 h-4 bg-slate-300 rounded-full opacity-50" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Nenhuma tarefa</p>
                        </div>
                      </div>
                    )}
                    
                    {provided.placeholder}
                  </div>
                </div>
                </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </div>
      </DragDropContext>

      {tasks.length === 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-3xl border border-slate-200/60 shadow-lg">
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59 130 246) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
          
          {/* Círculo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl" />
          
          <CardContent className="relative text-center py-16 px-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-6 shadow-lg">
              <Kanban className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
              Este projeto ainda não possui tarefas cadastradas. Comece adicionando tarefas no cronograma do projeto.
            </p>
            <div className="flex justify-center">
              <Link href={`/admin/projects/${project.id}`}>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ir para Cronograma
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      )}
      </div>
    </>
  )
}
