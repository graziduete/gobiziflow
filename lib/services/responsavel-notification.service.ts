import { createClient } from '@/lib/supabase/client'
import { Responsavel, NotificationLog } from '@/lib/types'
import { sendEmail, emailTemplates } from '@/lib/email-server'
import { formatDateBrazil as formatDateUtil } from '@/lib/utils/status-translation'

export class ResponsavelNotificationService {
  private supabase = createClient()

  /**
   * Formata data considerando timezone do Brasil (usa função utilitária corrigida)
   */
  private formatDateBrazil(dateString: string | undefined): string {
    if (!dateString) {
      console.warn('⚠️ formatDateBrazil: dateString é undefined ou vazio')
      return 'Não definida'
    }
    
    console.log('📅 formatDateBrazil: Recebido:', dateString)
    
    const formatted = formatDateUtil(dateString)
    
    if (!formatted) {
      console.error('❌ formatDateBrazil: Data inválida:', dateString)
      return 'Data inválida'
    }
    
    console.log('✅ formatDateBrazil: Formatado:', formatted)
    return formatted
  }

  /**
   * Verifica se um responsável é usuário cadastrado no sistema
   */
  async isResponsavelRegisteredUser(responsavelId: string): Promise<{ isRegistered: boolean; userId?: string }> {
    try {
      const { data: responsavel } = await this.supabase
        .from('responsaveis')
        .select('email')
        .eq('id', responsavelId)
        .single()

      if (!responsavel) {
        return { isRegistered: false }
      }

      // Verificar se existe um perfil com o mesmo email
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', responsavel.email)
        .single()

      return {
        isRegistered: !!profile,
        userId: profile?.id
      }
    } catch (error) {
      console.error('Erro ao verificar se responsável é usuário registrado:', error)
      return { isRegistered: false }
    }
  }

  /**
   * Envia notificação para responsável (sino + email se registrado, apenas email se não registrado)
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
    try {
      console.log('🔔 [ResponsavelNotification] Iniciando notificação:', { responsavelId, type, title })
      
      // Verificar se já existe uma notificação similar recente (últimas 2 horas)
      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

      const { data: existingNotification } = await this.supabase
        .from('notifications')
        .select('id')
        .eq('responsavel_id', responsavelId)
        .eq('type', type)
        .eq('title', title)
        .eq('project_id', projectId || null)
        .eq('task_id', taskId || null)
        .gte('created_at', twoHoursAgo.toISOString())
        .limit(1)

      if (existingNotification && existingNotification.length > 0) {
        console.log(`🔔 [ResponsavelNotification] Notificação duplicada evitada para responsável ${responsavelId} - tipo: ${type}`)
        return { success: true, message: 'Notificação duplicada evitada' }
      }
      
      const { isRegistered, userId } = await this.isResponsavelRegisteredUser(responsavelId)
      console.log('🔔 [ResponsavelNotification] Status do usuário:', { isRegistered, userId })

      // Buscar dados do responsável pelo ID
      console.log('🔔 [ResponsavelNotification] Buscando responsável com ID:', responsavelId)
      const { data: responsavel, error: responsavelError } = await this.supabase
        .from('responsaveis')
        .select('id, nome, email, empresa')
        .eq('id', responsavelId)
        .maybeSingle() // Usar maybeSingle() em vez de single()

      if (responsavelError) {
        console.error('🔔 [ResponsavelNotification] Erro ao buscar responsável:', responsavelError)
        throw new Error(`Erro ao buscar responsável: ${responsavelError.message}`)
      }

      if (!responsavel) {
        throw new Error('Responsável não encontrado')
      }

      console.log('🔔 [ResponsavelNotification] Dados do responsável:', responsavel)
      console.log('🔔 [ResponsavelNotification] Verificando condições para notificação in-app:', { isRegistered, userId })

      // Se for usuário registrado, criar notificação in-app
      if (isRegistered && userId) {
        console.log('🔔 [ResponsavelNotification] Criando notificação in-app para usuário registrado:', userId)
        const notificationData = {
          user_id: userId,
          title,
          message,
          type,
          project_id: projectId,
          responsavel_id: responsavelId,
          read: false
        }

        // Só adicionar task_id se for fornecido e válido
        if (taskId && taskId !== 'undefined' && taskId !== 'null') {
          notificationData.task_id = taskId
        }

        const { data: notificationResult, error: notificationError } = await this.supabase
          .from('notifications')
          .insert(notificationData)
          .select()

        if (notificationError) {
          console.error('🔔 [ResponsavelNotification] Erro ao criar notificação in-app:', notificationError)
        } else {
          console.log('🔔 [ResponsavelNotification] Notificação in-app criada com sucesso:', notificationResult)
        }
      } else {
        console.log('🔔 [ResponsavelNotification] Usuário não registrado, apenas email será enviado')
      }

      // Sempre enviar email (registrado ou não)
      await this.sendEmailNotification(
        responsavelId,
        responsavel.email,
        type,
        title,
        message,
        projectId,
        taskId,
        taskDetails
      )

      return { success: true, isRegistered }
    } catch (error) {
      console.error('Erro ao notificar responsável:', error)
      throw error
    }
  }

  /**
   * Envia notificação por email e registra no log
   */
  private async sendEmailNotification(
    responsavelId: string,
    email: string,
    type: 'project_assigned' | 'deadline_warning' | 'deadline_urgent' | 'task_overdue',
    title: string,
    message: string,
    projectId?: string,
    taskId?: string,
    taskDetails?: Array<{ name: string; start_date?: string; end_date?: string }>
  ) {
    // Declarar logId no escopo da função
    let logId: string | null = null
    
    try {
      // Aqui você pode integrar com seu serviço de email (SendGrid, Resend, etc.)
      // Por enquanto, vamos apenas registrar no log
      
      // Tentar inserir no log (não crítico se falhar)
      try {
        const { data: logData, error } = await this.supabase
          .from('notification_logs')
          .insert({
            responsavel_id: responsavelId,
            email,
            type,
            subject: title,
            message,
            project_id: projectId,
            task_id: taskId,
            status: 'pending' // Será atualizado após o envio
          })
          .select('id')
          .single()

        if (error) {
          console.error('🔔 [ResponsavelNotification] Erro ao registrar log (não crítico):', error)
        } else {
          logId = logData?.id || null
          console.log('🔔 [ResponsavelNotification] Log registrado com sucesso, ID:', logId)
        }
      } catch (logError) {
        console.error('🔔 [ResponsavelNotification] Erro ao registrar log (não crítico):', logError)
        // Não falhar a notificação por causa do log
      }

      // Buscar dados do projeto se disponível
      let projectName = 'Projeto'
      if (projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single()
        if (project) {
          projectName = project.name
        }
      }

      // Buscar dados do responsável para personalizar o email
      const { data: responsavel } = await this.supabase
        .from('responsaveis')
        .select('nome')
        .eq('id', responsavelId)
        .single()

      const responsibleName = responsavel?.nome || 'Responsável'

          // Gerar template de email baseado no tipo
          let emailTemplate
          switch (type) {
            case 'project_assigned':
              // Se temos taskDetails, usar as tarefas reais com datas
              if (taskDetails && taskDetails.length > 0) {
                const taskNames = taskDetails.map(task => task.name).join(', ')
                const taskCount = taskDetails.length
                
                // Criar template personalizado para múltiplas tarefas
                emailTemplate = {
                  subject: `🎯 ${taskCount} Nova(s) Tarefa(s) Atribuída(s) - ${projectName}`,
                  html: `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Nova(s) Tarefa(s) Atribuída(s)</title>
                      <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
                        .header { background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                        .content { padding: 40px 30px; }
                        .welcome { font-size: 18px; color: #374151; margin-bottom: 30px; text-align: center; }
                        .task-box { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 25px 0; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
                        .task-title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 15px; }
                        .task-details { margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; border: 1px solid #e2e8f0; }
                        .detail-item { margin: 10px 0; font-size: 16px; color: #374151; }
                        .detail-label { font-weight: 600; color: #1f2937; }
                        .task-list { text-align: left; margin: 20px 0; }
                        .task-item { margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
                        .task-name { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
                        .task-dates { font-size: 14px; color: #6b7280; }
                        .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 25px 0; transition: transform 0.2s; }
                        .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h1>🎯 ${taskCount} Nova(s) Tarefa(s) Atribuída(s)</h1>
                          <p>Você foi designado para ${taskCount} tarefa(s)</p>
                        </div>

                        <div class="content">
                          <div class="welcome">
                            Olá <strong>${responsibleName}</strong>! 👋
                          </div>

                          <div class="task-box">
                            <div class="task-title">Projeto: ${projectName}</div>
                            <div class="task-details">
                              <div class="detail-item">
                                <span class="detail-label">📋 Tarefas:</span> ${taskCount} tarefa(s) atribuída(s)
                              </div>
                              <div class="detail-item">
                                <span class="detail-label">👤 Responsável:</span> ${responsibleName}
                              </div>
                              <div class="detail-item">
                                <span class="detail-label">📅 Data:</span> ${new Date().toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            
                            <div class="task-list">
                              ${taskDetails.map(task => {
                                const startDate = this.formatDateBrazil(task.start_date)
                                const endDate = this.formatDateBrazil(task.end_date)
                                return `
                                  <div class="task-item">
                                    <div class="task-name">${task.name}</div>
                                    <div class="task-dates">Início: ${startDate} | Fim: ${endDate}</div>
                                  </div>
                                `
                              }).join('')}
                            </div>
                          </div>

                          <p style="text-align: center; color: #6b7280; margin: 30px 0;">
                            Acesse o sistema para mais detalhes sobre as tarefas e acompanhar o progresso.
                          </p>
                        </div>

                        <div class="footer">
                          <p>Esta é uma notificação automática do sistema de gestão de projetos.</p>
                          <p>© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `,
                  text: `🎯 ${taskCount} Nova(s) Tarefa(s) Atribuída(s)\n\nOlá ${responsibleName}! 👋\n\nVocê foi designado para ${taskCount} tarefa(s) no projeto "${projectName}":\n\n${taskDetails.map(task => {
                    const startDate = this.formatDateBrazil(task.start_date)
                    const endDate = this.formatDateBrazil(task.end_date)
                    return `• ${task.name} (Início: ${startDate}, Fim: ${endDate})`
                  }).join('\n')}\n\nAcesse o sistema para mais detalhes sobre as tarefas e acompanhar o progresso.\n\nEsta é uma notificação automática do sistema de gestão de projetos.\n\n© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.`
                }
              } else {
                // Fallback para tarefa única (comportamento antigo)
                const taskNameMatch = message.match(/"([^"]+)"/)
                const taskName = taskNameMatch ? taskNameMatch[1] : 'Nova Tarefa'
                emailTemplate = emailTemplates.projectAssigned(taskName, projectName, responsibleName)
              }
              break
        case 'deadline_warning':
          const warningTaskMatch = message.match(/"([^"]+)"/)
          const warningTaskName = warningTaskMatch ? warningTaskMatch[1] : 'Tarefa'
          const warningDateMatch = message.match(/\(([^)]+)\)/)
          const warningDate = warningDateMatch ? warningDateMatch[1] : 'Data não informada'
          emailTemplate = emailTemplates.deadlineWarning(warningTaskName, warningDate, projectName)
          break
        case 'deadline_urgent':
          const urgentTaskMatch = message.match(/"([^"]+)"/)
          const urgentTaskName = urgentTaskMatch ? urgentTaskMatch[1] : 'Tarefa'
          const urgentDateMatch = message.match(/\(([^)]+)\)/)
          const urgentDate = urgentDateMatch ? urgentDateMatch[1] : 'Data não informada'
          emailTemplate = emailTemplates.deadlineUrgent(urgentTaskName, urgentDate, projectName)
          break
        case 'task_overdue':
          const overdueTaskMatch = message.match(/"([^"]+)"/)
          const overdueTaskName = overdueTaskMatch ? overdueTaskMatch[1] : 'Tarefa'
          const overdueDateMatch = message.match(/Data de vencimento: ([^.]+)\./)
          const overdueDate = overdueDateMatch ? overdueDateMatch[1] : 'Data não informada'
          emailTemplate = emailTemplates.taskOverdue(overdueTaskName, overdueDate, projectName)
          break
        default:
          // Fallback para tipos não mapeados
          emailTemplate = {
            subject: title,
            html: `<p>${message}</p>`,
            text: message
          }
      }

      // Enviar email
      const emailResult = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Falha ao enviar email')
      }

      console.log(`📧 Email enviado para ${email}: ${emailTemplate.subject}`)

      // Atualizar status do log para 'sent' usando o logId
      console.log('🔔 [ResponsavelNotification] Tentando atualizar log com ID:', logId)
      if (logId) {
        try {
          const { error: updateError } = await this.supabase
            .from('notification_logs')
            .update({ status: 'sent' })
            .eq('id', logId)
          
          if (updateError) {
            console.error('🔔 [ResponsavelNotification] Erro ao atualizar status do log:', updateError)
          } else {
            console.log('🔔 [ResponsavelNotification] Status do log atualizado para "sent" com sucesso')
          }
        } catch (updateError) {
          console.error('🔔 [ResponsavelNotification] Erro ao atualizar status do log (não crítico):', updateError)
        }
      } else {
        console.warn('🔔 [ResponsavelNotification] logId é null/undefined, não foi possível atualizar status')
      }
      
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      
      // Atualizar status do log para 'failed' usando o logId
      if (logId) {
        try {
          await this.supabase
            .from('notification_logs')
            .update({ status: 'failed' })
            .eq('id', logId)
          console.log('🔔 [ResponsavelNotification] Status do log atualizado para "failed"')
        } catch (logError) {
          console.error('🔔 [ResponsavelNotification] Erro ao registrar log de falha (não crítico):', logError)
        }
      }
      
      throw error
    }
  }

  /**
   * Notifica sobre novo projeto com tarefas atribuídas
   */
  async notifyNewProjectWithTasks(
    responsavelId: string,
    projectName: string,
    tasks: Array<{ name: string; start_date: string; end_date: string; status: string }>,
    projectId: string
  ) {
    const responsavel = await this.getResponsavelById(responsavelId)
    if (!responsavel) return

    const title = `🆕 Novo Projeto: ${projectName}`
    const tasksText = tasks.map(task => 
      `• ${task.name} (${new Date(task.start_date).toLocaleDateString('pt-BR')} - ${new Date(task.end_date).toLocaleDateString('pt-BR')}) - ${task.status}`
    ).join('\n')

    const message = `Olá ${responsavel.nome}!\n\nVocê foi designado para ${tasks.length} tarefa(s) no projeto "${projectName}":\n\n${tasksText}\n\nAcesse o sistema para mais detalhes.`

    return await this.notifyResponsavel(responsavelId, 'project_assigned', title, message, projectId)
  }

  /**
   * Notifica sobre prazo próximo (3 dias antes)
   */
  async notifyDeadlineWarning(responsavelId: string, taskName: string, endDate: string, projectId: string, taskId?: string) {
    const responsavel = await this.getResponsavelById(responsavelId)
    if (!responsavel) return

    // Buscar nome do projeto
    const { data: project } = await this.supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    const projectName = project?.name || 'Projeto'

    const title = `⏰ Tarefas sob sua responsabilidade vencem em breve`
    const message = `Olá ${responsavel.nome}!\n\nA tarefa "${taskName}" do projeto "${projectName}" vence em ${this.formatDateBrazil(endDate)}.\n\nPor favor, verifique o status e tome as ações necessárias.`

    return await this.notifyResponsavel(responsavelId, 'deadline_warning', title, message, projectId, taskId)
  }

  /**
   * Notifica sobre prazo urgente (1 dia antes)
   */
  async notifyDeadlineUrgent(responsavelId: string, taskName: string, endDate: string, projectId: string, taskId?: string) {
    const responsavel = await this.getResponsavelById(responsavelId)
    if (!responsavel) return

    // Buscar nome do projeto
    const { data: project } = await this.supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    const projectName = project?.name || 'Projeto'

    const title = `🚨 Tarefas sob sua responsabilidade vencem amanhã`
    const message = `Olá ${responsavel.nome}!\n\nA tarefa "${taskName}" do projeto "${projectName}" vence amanhã (${this.formatDateBrazil(endDate)}).\n\nAção imediata necessária!`

    return await this.notifyResponsavel(responsavelId, 'deadline_urgent', title, message, projectId, taskId)
  }

  /**
   * Notifica sobre tarefa atrasada
   */
  async notifyTaskOverdue(responsavelId: string, taskName: string, endDate: string, projectId: string, taskId?: string) {
    const responsavel = await this.getResponsavelById(responsavelId)
    if (!responsavel) return

    // Buscar nome do projeto
    const { data: project } = await this.supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    const projectName = project?.name || 'Projeto'

    const title = `❌ Tarefa Atrasada`
    const message = `Olá ${responsavel.nome}!\n\nA tarefa "${taskName}" do projeto "${projectName}" está atrasada desde ${this.formatDateBrazil(endDate)}.\n\nStatus foi alterado automaticamente para "Atrasada".`

    return await this.notifyResponsavel(responsavelId, 'task_overdue', title, message, projectId, taskId)
  }

  /**
   * Busca responsável por ID
   */
  private async getResponsavelById(id: string): Promise<Responsavel | null> {
    try {
      const { data, error } = await this.supabase
        .from('responsaveis')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar responsável:', error)
      return null
    }
  }

  /**
   * Busca tarefas próximas do vencimento para monitoramento
   */
  async getTasksNearDeadline(daysBefore: number = 3) {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysBefore)
      
      // Esta query seria implementada quando tivermos a tabela de tarefas
      // Por enquanto, retornamos array vazio
      return []
    } catch (error) {
      console.error('Erro ao buscar tarefas próximas do vencimento:', error)
      return []
    }
  }
}

export const responsavelNotificationService = new ResponsavelNotificationService()
