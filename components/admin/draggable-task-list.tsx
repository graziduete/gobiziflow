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
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface Task {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  responsible: string
  description?: string
  order?: number
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
}

interface SortableTaskItemProps {
  task: Task
  index: number
  responsaveis: Responsavel[]
  onUpdateTask: (taskId: string, field: keyof Task, value: string) => void
  onRemoveTask: (taskId: string) => void
}

function SortableTaskItem({ task, index, responsaveis, onUpdateTask, onRemoveTask }: SortableTaskItemProps) {
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

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-blue-50 ${isDragging ? 'bg-blue-100' : ''}`}
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

      {/* Nome da tarefa */}
      <td className="p-4">
        <Input
          value={task.name || ''}
          onChange={(e) => onUpdateTask(task.id, "name", e.target.value)}
          placeholder="Nome da tarefa"
          className="border-0 bg-transparent p-0 text-sm focus:ring-0 w-full"
        />
      </td>

      {/* Data de início */}
      <td className="p-4">
        <Input
          type="date"
          value={task.start_date || ''}
          onChange={(e) => onUpdateTask(task.id, "start_date", e.target.value)}
          className="border-0 bg-transparent p-0 text-sm focus:ring-0 w-full"
        />
      </td>

      {/* Data de fim */}
      <td className="p-4">
        <Input
          type="date"
          value={task.end_date || ''}
          onChange={(e) => onUpdateTask(task.id, "end_date", e.target.value)}
          className="border-0 bg-transparent p-0 text-sm focus:ring-0 w-full"
        />
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
        <Select
          value={task.status}
          onValueChange={(value) => onUpdateTask(task.id, "status", value)}
        >
          <SelectTrigger className="border-0 bg-transparent p-0 h-auto w-full">
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
      </td>

      {/* Ações */}
      <td className="p-4 text-center">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemoveTask(task.id)}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </td>
    </tr>
  )
}

export function DraggableTaskList({ tasks, onUpdateTask, onRemoveTask, onReorderTasks }: DraggableTaskListProps) {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  
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
              <th className="text-left p-4 font-medium text-sm w-1/3">Tarefa</th>
              <th className="text-left p-4 font-medium text-sm w-1/6">Data Início</th>
              <th className="text-left p-4 font-medium text-sm w-1/6">Data Fim</th>
              <th className="text-left p-4 font-medium text-sm w-1/6">Responsável</th>
              <th className="text-left p-4 font-medium text-sm w-1/6">Status</th>
              <th className="text-center p-4 font-medium text-sm w-1/12">Ações</th>
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
                  onUpdateTask={onUpdateTask}
                  onRemoveTask={onRemoveTask}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  )
}