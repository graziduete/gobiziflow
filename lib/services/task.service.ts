import { createClient } from '@/lib/supabase/client'
import { Task, GanttTask } from '@/lib/types'

export class TaskService {
  private supabase = createClient()

  async getAllTasks() {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_assigned_to_fkey (full_name),
          profiles!tasks_created_by_fkey (full_name)
        `)
        .order('due_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }
  }

  async getTasksByProject(projectId: string) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_assigned_to_fkey (full_name),
          profiles!tasks_created_by_fkey (full_name)
        `)
        .eq('project_id', projectId)
        .order('start_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas do projeto:', error)
      throw error
    }
  }

  async getTaskById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (*),
          profiles!tasks_assigned_to_fkey (*),
          profiles!tasks_created_by_fkey (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      throw error
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }
  }

  async updateTask(id: string, updates: Partial<Task>) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
  }

  async deleteTask(id: string) {
    try {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      throw error
    }
  }

  async getTasksByStatus(status: Task['status']) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_assigned_to_fkey (full_name)
        `)
        .eq('status', status)
        .order('due_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas por status:', error)
      throw error
    }
  }

  async getTasksByAssignee(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_created_by_fkey (full_name)
        `)
        .eq('assigned_to', userId)
        .order('due_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas do usuário:', error)
      throw error
    }
  }

  async getTasksByDateRange(startDate: string, endDate: string, projectId?: string) {
    try {
      let query = this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_assigned_to_fkey (full_name)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date')

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas por período:', error)
      throw error
    }
  }

  async getGanttTasks(projectId: string): Promise<GanttTask[]> {
    try {
      const tasks = await this.getTasksByProject(projectId)
      
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: task.start_date,
        end: task.end_date,
        progress: this.calculateTaskProgress(task),
        dependencies: task.dependencies || [],
        resource: task.assigned_to,
        status: task.status,
      }))
    } catch (error) {
      console.error('Erro ao gerar tarefas do Gantt:', error)
      throw error
    }
  }

  async updateTaskProgress(id: string, actualHours: number, status: Task['status']) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          actual_hours: actualHours,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar progresso da tarefa:', error)
      throw error
    }
  }

  async getOverdueTasks() {
    try {
      const now = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_assigned_to_fkey (full_name)
        `)
        .lt('due_date', now)
        .neq('status', 'completed')
        .order('due_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas atrasadas:', error)
      throw error
    }
  }

  async getTasksByPriority(priority: Task['priority']) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects (name, type),
          profiles!tasks_assigned_to_fkey (full_name)
        `)
        .eq('priority', priority)
        .order('due_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar tarefas por prioridade:', error)
      throw error
    }
  }

  private calculateTaskProgress(task: Task): number {
    if (task.estimated_hours === 0) return 0
    return Math.min((task.actual_hours / task.estimated_hours) * 100, 100)
  }

  async bulkUpdateTasks(tasks: Array<{ id: string; updates: Partial<Task> }>) {
    try {
      const updates = tasks.map(({ id, updates }) => ({
        id,
        ...updates,
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await this.supabase
        .from('tasks')
        .upsert(updates, { onConflict: 'id' })
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar tarefas em lote:', error)
      throw error
    }
  }

  async getTaskDependencies(taskId: string): Promise<Task[]> {
    try {
      const task = await this.getTaskById(taskId)
      if (!task.dependencies || task.dependencies.length === 0) {
        return []
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .in('id', task.dependencies)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar dependências da tarefa:', error)
      throw error
    }
  }
}

export const taskService = new TaskService() 