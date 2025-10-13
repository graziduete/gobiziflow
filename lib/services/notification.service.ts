import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { responsavelNotificationService } from './responsavel-notification.service'

export class NotificationService {
  private supabase = createClient()

  async getNotificationsByUser(userId: string) {
    try {
      // Obter dados do usuário logado
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar perfil do usuário
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = this.supabase
        .from('notifications')
        .select(`
          *,
          projects!notifications_project_id_fkey (tenant_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Se for Client Admin, filtrar por tenant_id
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await this.supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('projects.tenant_id', clientAdmin.company_id)
        }
      } 
      // Se for Admin Normal, filtrar apenas notificações de projetos sem tenant_id
      else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('projects.tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      throw error
    }
  }

  async getUnreadNotifications(userId: string) {
    try {
      // Obter dados do usuário logado
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar perfil do usuário
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role, is_client_admin')
        .eq('id', user.id)
        .single()

      let query = this.supabase
        .from('notifications')
        .select(`
          *,
          projects!notifications_project_id_fkey (tenant_id)
        `)
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })

      // Se for Client Admin, filtrar por tenant_id
      if (profile?.is_client_admin) {
        const { data: clientAdmin } = await this.supabase
          .from('client_admins')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (clientAdmin?.company_id) {
          query = query.eq('projects.tenant_id', clientAdmin.company_id)
        }
      } 
      // Se for Admin Normal, filtrar apenas notificações de projetos sem tenant_id
      else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        query = query.is('projects.tenant_id', null)
      }
      // Admin Master vê tudo (sem filtro)

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error)
      throw error
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw error
    }
  }

  async markNotificationAsRead(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      throw error
    }
  }

  async deleteNotification(id: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      throw error
    }
  }

  async createHoursWarningNotification(userId: string, companyName: string, remainingHours: number, totalHours: number) {
    try {
      const percentage = (remainingHours / totalHours) * 100
      let type: Notification['type'] = 'info'
      let title = 'Atenção às Horas Contratadas'
      let message = ``

      if (percentage <= 20) {
        type = 'warning'
        title = '⚠️ Horas Contratadas Críticas'
        message = `A empresa ${companyName} possui apenas ${remainingHours}h restantes (${percentage.toFixed(1)}% do total contratado). Considere renovar o contrato.`
      } else if (percentage <= 40) {
        type = 'warning'
        title = '⚠️ Horas Contratadas Baixas'
        message = `A empresa ${companyName} possui ${remainingHours}h restantes (${percentage.toFixed(1)}% do total contratado).`
      } else {
        message = `A empresa ${companyName} possui ${remainingHours}h restantes (${percentage.toFixed(1)}% do total contratado).`
      }

      return await this.createNotification({
        user_id: userId,
        title,
        message,
        type,
        read: false,
      })
    } catch (error) {
      console.error('Erro ao criar notificação de horas:', error)
      throw error
    }
  }

  async createProjectStatusNotification(userId: string, projectName: string, status: string, companyName: string) {
    try {
      const title = `Status do Projeto Atualizado`
      const message = `O projeto "${projectName}" da empresa ${companyName} foi atualizado para: ${status}`

      return await this.createNotification({
        user_id: userId,
        title,
        message,
        type: 'info',
        read: false,
      })
    } catch (error) {
      console.error('Erro ao criar notificação de status:', error)
      throw error
    }
  }

  async createTaskAssignmentNotification(userId: string, taskTitle: string, projectName: string) {
    try {
      const title = `Nova Tarefa Atribuída`
      const message = `Você foi designado para a tarefa "${taskTitle}" no projeto "${projectName}"`

      return await this.createNotification({
        user_id: userId,
        title,
        message,
        type: 'info',
        read: false,
      })
    } catch (error) {
      console.error('Erro ao criar notificação de atribuição:', error)
      throw error
    }
  }

  async createOverdueProjectNotification(userId: string, projectName: string, companyName: string) {
    try {
      const title = `🚨 Projeto Atrasado`
      const message = `O projeto "${projectName}" da empresa ${companyName} está atrasado. Ação imediata necessária.`

      return await this.createNotification({
        user_id: userId,
        title,
        message,
        type: 'error',
        read: false,
      })
    } catch (error) {
      console.error('Erro ao criar notificação de projeto atrasado:', error)
      throw error
    }
  }

  async getNotificationCount(userId: string) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao contar notificações:', error)
      return 0
    }
  }

  async deleteOldNotifications(userId: string, daysOld: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar notificações antigas:', error)
      throw error
    }
  }

  // ===== MÉTODOS PARA RESPONSÁVEIS =====

  /**
   * Notifica responsável sobre novo projeto com tarefas
   */
  async notifyResponsavelNewProject(
    responsavelId: string,
    projectName: string,
    tasks: Array<{ name: string; start_date: string; end_date: string; status: string }>,
    projectId: string
  ) {
    return await responsavelNotificationService.notifyNewProjectWithTasks(
      responsavelId,
      projectName,
      tasks,
      projectId
    )
  }

  /**
   * Notifica responsável sobre tarefa atribuída
   */
  async notifyResponsavel(
    responsavelId: string,
    type: 'project_assigned' | 'deadline_warning' | 'deadline_urgent' | 'task_overdue',
    title: string,
    message: string,
    projectId?: string,
    taskId?: string,
    taskDetails?: Array<{ name: string; start_date?: string; end_date?: string }>
  ) {
    return await responsavelNotificationService.notifyResponsavel(
      responsavelId,
      type,
      title,
      message,
      projectId,
      taskId,
      taskDetails
    )
  }

  /**
   * Notifica responsável sobre prazo próximo
   */
  async notifyResponsavelDeadlineWarning(
    responsavelId: string,
    taskName: string,
    endDate: string,
    projectId: string,
    taskId?: string
  ) {
    return await responsavelNotificationService.notifyDeadlineWarning(
      responsavelId,
      taskName,
      endDate,
      projectId,
      taskId
    )
  }

  /**
   * Notifica responsável sobre prazo urgente
   */
  async notifyResponsavelDeadlineUrgent(
    responsavelId: string,
    taskName: string,
    endDate: string,
    projectId: string,
    taskId?: string
  ) {
    return await responsavelNotificationService.notifyDeadlineUrgent(
      responsavelId,
      taskName,
      endDate,
      projectId,
      taskId
    )
  }

  /**
   * Notifica responsável sobre tarefa atrasada
   */
  async notifyResponsavelTaskOverdue(
    responsavelId: string,
    taskName: string,
    endDate: string,
    projectId: string,
    taskId?: string
  ) {
    return await responsavelNotificationService.notifyTaskOverdue(
      responsavelId,
      taskName,
      endDate,
      projectId,
      taskId
    )
  }

  /**
   * Verifica se responsável é usuário registrado
   */
  async isResponsavelRegistered(responsavelId: string) {
    return await responsavelNotificationService.isResponsavelRegisteredUser(responsavelId)
  }
}

export const notificationService = new NotificationService() 