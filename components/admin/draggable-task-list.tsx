"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, AlertTriangle, Link2, Lock, Unlock, Calendar, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { DelayJustificationModal } from "@/components/admin/delay-justification-modal"
import { TaskDependencyModal } from "@/components/admin/task-dependency-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
  order?: number
  delay_justification?: string
  original_end_date?: string
  actual_end_date?: string
  delay_created_at?: string
  delay_created_by?: string
  // Novos campos de datas e dependências
  actual_start_date?: string
  predicted_end_date?: string
  dependency_type?: string
  predecessor_task_id?: string
}

interface Responsavel {
  id: string
  nome: string
  email: string
  ativo: boolean
}

interface DraggableTaskListProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, field: keyof Task, value: string) => void
  onRemoveTask: (taskId: string) => void
  onReorderTasks: (oldIndex: number, newIndex: number) => void
  onRefreshTasks?: () => void
  invalidTasks?: Set<string>
  onSaveDependency?: (taskId: string, dependencyType: string, predecessorId: string | null) => void
}

interface SortableTaskItemProps {
  task: Task
  index: number
  responsaveis: Responsavel[]
  allTasks: Task[]
  onUpdateTask: (taskId: string, field: keyof Task, value: string) => void
  onRemoveTask: (taskId: string) => void
  onStatusChange: (taskId: string, newStatus: string) => void
  onOpenDependencyModal: (task: Task) => void
  invalidTasks?: Set<string>
}

function SortableTaskItem({ task, index, responsaveis, allTasks, onUpdateTask, onRemoveTask, onStatusChange, onOpenDependencyModal, invalidTasks = new Set() }: SortableTaskItemProps) {
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

  // Verificar se esta tarefa tem datas inválidas
  const isTaskInvalid = invalidTasks.has(task.id)
  const invalidDateClass = isTaskInvalid ? "!border-red-500 !border-2 focus:!border-red-500 focus:!ring-red-500/20" : ""

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started": return "Não Iniciado"
      case "in_progress": return "Em Andamento"
      case "completed": return "Concluído"
      case "on_hold": return "Pausado"
      case "delayed": return "Atrasado"
      default: return "Não Iniciado"
    }
  }

  const hasDelayJustification = task.delay_justification && task.status === 'completed_delayed'

  // Encontrar tarefa predecessora
  const predecessorTask = task.predecessor_task_id 
    ? allTasks.find(t => t.id === task.predecessor_task_id)
    : null

  // Verificar se predecessora foi concluída
  const isPredecessorCompleted = predecessorTask 
    ? predecessorTask.status === 'completed' || predecessorTask.status === 'completed_delayed'
    : true

  // Formatar datas
  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-blue-50 ${isDragging ? 'bg-blue-100' : ''} ${hasDelayJustification ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''} ${isTaskInvalid ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
    >
      {/* Handle de arrastar */}
      <td className="p-2 w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-100 rounded p-1 transition-colors"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </td>

      {/* Nome da tarefa com badges */}
      <td className="p-4">
        <div className="space-y-2">
          <Input
            value={task.name || ''}
            onChange={(e) => onUpdateTask(task.id, "name", e.target.value)}
            placeholder="Nome da tarefa"
            className="border-0 bg-transparent p-0 text-sm focus:ring-0 w-full"
          />
          {/* Badges de dependência */}
          {task.dependency_type === 'finish_to_start' && predecessorTask && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={`text-xs flex items-center gap-1 ${
                        isPredecessorCompleted 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isPredecessorCompleted ? (
                        <Unlock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      Depende de {predecessorTask.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p><strong>Predecessora:</strong> {predecessorTask.name}</p>
                      <p><strong>Status:</strong> {getStatusText(predecessorTask.status)}</p>
                      {isPredecessorCompleted ? (
                        <p className="text-green-600 font-medium">✓ Pode iniciar</p>
                      ) : (
                        <p className="text-amber-600 font-medium">⏳ Aguardando conclusão</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </td>

      {/* Data de início */}
      <td className="p-2">
        <Input
          type="date"
          value={task.start_date || ''}
          onChange={(e) => onUpdateTask(task.id, "start_date", e.target.value)}
          className={`border-0 bg-transparent p-0 text-xs focus:ring-0 w-full ${invalidDateClass}`}
        />
      </td>

      {/* Data de fim planejada */}
      <td className="p-2">
        <Input
          type="date"
          value={task.end_date || ''}
          onChange={(e) => onUpdateTask(task.id, "end_date", e.target.value)}
          className={`border-0 bg-transparent p-0 text-xs focus:ring-0 w-full ${invalidDateClass}`}
        />
      </td>

      {/* Data Início Real (read-only) */}
      <td className="p-2">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          {task.actual_start_date ? (
            <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{formatDate(task.actual_start_date)}</span>
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </td>

      {/* Data Fim Prevista (read-only) */}
      <td className="p-2">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          {task.predicted_end_date ? (
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span className="font-medium">{formatDate(task.predicted_end_date)}</span>
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </td>

      {/* Data Fim Real (read-only) */}
      <td className="p-2">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          {task.actual_end_date ? (
            <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span className="font-medium">{formatDate(task.actual_end_date)}</span>
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </td>

      {/* Responsável */}
      <td className="p-4">
        <Select
          value={task.responsible || undefined}
          onValueChange={(value) => onUpdateTask(task.id, "responsible", value)}
        >
          <SelectTrigger className="border-0 bg-transparent p-0 h-auto w-full">
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {responsaveis.map((responsavel) => (
              <SelectItem key={responsavel.id} value={responsavel.nome}>
                {responsavel.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Status */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Select
            value={task.status}
            onValueChange={(value) => onStatusChange(task.id, value)}
          >
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Não Iniciado</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="completed_delayed">Concluído com Atraso</SelectItem>
              <SelectItem value="on_hold">Pausado</SelectItem>
              <SelectItem value="delayed">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Ícone de alerta para tarefas com justificativa */}
          {hasDelayJustification && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                </TooltipTrigger>
                       <TooltipContent>
                         <div className="max-w-xs">
                           <p className="font-medium text-white mb-1">Tarefa com atraso justificado</p>
                           <p className="text-sm text-gray-200 mb-2">
                             <strong>Data planejada:</strong> {new Date(task.original_end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                           </p>
                           <p className="text-sm text-gray-200 mb-2">
                             <strong>Data real:</strong> {new Date(task.actual_end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                           </p>
                           <p className="text-sm text-gray-200">
                             <strong>Justificativa:</strong> {task.delay_justification}
                           </p>
                         </div>
                       </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>

      {/* Ações */}
      <td className="p-4">
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenDependencyModal(task)}
                  className="h-7 w-7 p-0 relative"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {task.dependency_type === 'finish_to_start' && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                      1
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Configurar dependência</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveTask(task.id)}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Excluir tarefa</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
    </tr>
  )
}

export function DraggableTaskList({ tasks, onUpdateTask, onRemoveTask, onReorderTasks, onRefreshTasks, invalidTasks = new Set(), onSaveDependency }: DraggableTaskListProps) {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false)
  const [selectedDependencyTask, setSelectedDependencyTask] = useState<Task | null>(null)
  
  // Removidas as funções de máscara complexa - usando inputs nativos de data
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchResponsaveis()
  }, [])

  const fetchResponsaveis = async () => {
    try {
      const supabase = createClient()
      console.log("🔍 [DraggableTaskList] Buscando responsáveis...")
      
      // Obter dados do usuário logado para aplicar filtros
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("🔍 [DraggableTaskList] Usuário não autenticado")
        setResponsaveis([])
        return
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from("responsaveis")
        .select("id, nome, email, ativo, tenant_id")
        .eq("ativo", true)

      // Aplicar filtros baseados no role
      if (profile?.is_client_admin) {
        // Client Admin: apenas responsáveis do seu tenant
        const { data: clientAdmin } = await supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('tenant_id', clientAdmin.company_id)
        } else {
          // Se não encontrar client_admin, não mostrar nenhum responsável
          query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000000') // UUID inválido
        }
      } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        // Admin Normal/Operacional: apenas responsáveis sem tenant_id
        query = query.is('tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      const { data, error } = await query.order("nome")

      if (error) {
        console.error("🔍 [DraggableTaskList] Erro ao buscar responsáveis:", error)
        throw error
      }
      
      console.log("🔍 [DraggableTaskList] Responsáveis encontrados:", data)
      setResponsaveis(data || [])
    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)

      onReorderTasks(oldIndex, newIndex)
    }
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId)
    
    if (newStatus === 'completed_delayed') {
      // Abrir modal de justificativa
      setSelectedTask(task || null)
      setIsModalOpen(true)
    } else {
      // Mudança normal de status
      onUpdateTask(taskId, 'status', newStatus)
    }
  }

  const handleModalSuccess = () => {
    // Recarregar tasks do banco para incluir dados de justificativa
    if (onRefreshTasks) {
      console.log("🔄 [DraggableTaskList] Recarregando tasks após justificativa...")
      onRefreshTasks()
    }
    
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleOpenDependencyModal = (task: Task) => {
    setSelectedDependencyTask(task)
    setIsDependencyModalOpen(true)
  }

  const handleSaveDependency = (taskId: string, dependencyType: string, predecessorId: string | null) => {
    if (onSaveDependency) {
      onSaveDependency(taskId, dependencyType, predecessorId)
    }
    setIsDependencyModalOpen(false)
    setSelectedDependencyTask(null)
  }

  // Ordenar tarefas por ordem
  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-center p-4 font-medium text-sm w-8">⋮⋮</th>
              <th className="text-left p-4 font-medium text-sm">Tarefa</th>
              <th className="text-left p-2 font-medium text-sm whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data Início<br/>Planejada
                </div>
              </th>
              <th className="text-left p-2 font-medium text-sm whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Data Fim<br/>Planejada
                </div>
              </th>
              <th className="text-left p-2 font-medium text-sm whitespace-nowrap bg-blue-50">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Data Início<br/>Real
                </div>
              </th>
              <th className="text-left p-2 font-medium text-sm whitespace-nowrap bg-amber-50">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Data Fim<br/>Prevista
                </div>
              </th>
              <th className="text-left p-2 font-medium text-sm whitespace-nowrap bg-green-50">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Data Fim<br/>Real
                </div>
              </th>
              <th className="text-left p-4 font-medium text-sm">Responsável</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-center p-4 font-medium text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              {sortedTasks.map((task, index) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  responsaveis={responsaveis}
                  allTasks={tasks}
                  onUpdateTask={onUpdateTask}
                  onRemoveTask={onRemoveTask}
                  onStatusChange={handleStatusChange}
                  onOpenDependencyModal={handleOpenDependencyModal}
                  invalidTasks={invalidTasks}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      {/* Modal de Justificativa de Atraso */}
      {selectedTask && (
        <DelayJustificationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          task={selectedTask}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modal de Dependências */}
      {selectedDependencyTask && (
        <TaskDependencyModal
          open={isDependencyModalOpen}
          onOpenChange={setIsDependencyModalOpen}
          task={selectedDependencyTask}
          allTasks={tasks}
          onSave={handleSaveDependency}
        />
      )}
    </div>
  )
}