import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/services/notification.service'

export async function GET(request: NextRequest) {
  return await processDeadlineMonitor(request)
}

export async function POST(request: NextRequest) {
  return await processDeadlineMonitor(request)
}

async function processDeadlineMonitor(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (cron job) - DESABILITADO PARA TESTES
    // const authHeader = request.headers.get('authorization')
    // const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    // if (authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const supabase = createClient()
    
    // Buscar tarefas próximas do vencimento
    const today = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)
    
    const oneDayFromNow = new Date()
    oneDayFromNow.setDate(today.getDate() + 1)

    // Buscar tarefas que vencem em 3 dias (aviso)
    // Usar predicted_end_date (prevista) quando disponível, senão usar end_date (planejada)
    const { data: allTasksWarning, error: warningError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        predicted_end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .not('end_date', 'is', null)
    
    // Filtrar no código: usar predicted_end_date se existir, senão end_date
    const tasksWarning = allTasksWarning?.filter(task => {
      const deadlineDate = task.predicted_end_date || task.end_date
      if (!deadlineDate) return false
      const deadline = new Date(deadlineDate + 'T00:00:00')
      const todayStart = new Date(today.toISOString().split('T')[0] + 'T00:00:00')
      const threeDaysStart = new Date(threeDaysFromNow.toISOString().split('T')[0] + 'T00:00:00')
      return deadline >= todayStart && deadline <= threeDaysStart
    })

    if (warningError) {
      console.error('Erro ao buscar tarefas para aviso:', warningError)
    }

    // Buscar tarefas que vencem em 1 dia (urgente)
    // Usar predicted_end_date (prevista) quando disponível, senão usar end_date (planejada)
    const { data: allTasksUrgent, error: urgentError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        predicted_end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .not('end_date', 'is', null)
    
    // Filtrar no código: usar predicted_end_date se existir, senão end_date
    const tasksUrgent = allTasksUrgent?.filter(task => {
      const deadlineDate = task.predicted_end_date || task.end_date
      if (!deadlineDate) return false
      const deadline = new Date(deadlineDate + 'T00:00:00')
      const todayStart = new Date(today.toISOString().split('T')[0] + 'T00:00:00')
      const oneDayStart = new Date(oneDayFromNow.toISOString().split('T')[0] + 'T00:00:00')
      return deadline >= todayStart && deadline <= oneDayStart
    })

    if (urgentError) {
      console.error('Erro ao buscar tarefas urgentes:', urgentError)
    }

    // Buscar tarefas atrasadas
    // Usar predicted_end_date (prevista) quando disponível, senão usar end_date (planejada)
    const { data: allTasksOverdue, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        predicted_end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .not('end_date', 'is', null)
    
    // Filtrar no código: usar predicted_end_date se existir, senão end_date
    const tasksOverdue = allTasksOverdue?.filter(task => {
      const deadlineDate = task.predicted_end_date || task.end_date
      if (!deadlineDate) return false
      const deadline = new Date(deadlineDate + 'T00:00:00')
      const todayStart = new Date(today.toISOString().split('T')[0] + 'T00:00:00')
      return deadline < todayStart
    })

    if (overdueError) {
      console.error('Erro ao buscar tarefas atrasadas:', overdueError)
    }

    const results = {
      warnings: 0,
      urgent: 0,
      overdue: 0,
      errors: []
    }

    // Processar avisos de 3 dias
    console.log(`📋 Tarefas com aviso de 3 dias: ${tasksWarning?.length || 0}`)
    if (tasksWarning) {
      for (const task of tasksWarning) {
        try {
          // Usar predicted_end_date (prevista) se existir, senão end_date (planejada)
          const deadlineDate = task.predicted_end_date || task.end_date
          
          // Validar se a tarefa tem data de vencimento
          if (!deadlineDate) {
            console.warn(`⚠️ Tarefa ${task.id} (${task.name}) não possui data de vencimento, pulando notificação`)
            continue
          }

          const dateType = task.predicted_end_date ? 'prevista' : 'planejada'
          console.log(`📝 Processando tarefa de aviso: ${task.name} (ID: ${task.id}, Status: ${task.status}, Data fim ${dateType}: ${deadlineDate})`)
          
          // Buscar responsável pelo nome
          const { data: responsavel } = await supabase
            .from('responsaveis')
            .select('id')
            .eq('nome', task.responsible)
            .single()
          
          console.log(`👤 Responsável encontrado: ${responsavel?.id || 'NÃO ENCONTRADO'}`)

          if (responsavel) {
            await notificationService.notifyResponsavelDeadlineWarning(
              responsavel.id,
              task.name,
              deadlineDate,
              task.project_id,
              task.id
            )
            results.warnings++
          }
        } catch (error) {
          console.error(`Erro ao notificar aviso para tarefa ${task.id}:`, error)
          results.errors.push(`Aviso tarefa ${task.id}: ${error}`)
        }
      }
    }

    // Processar urgências de 1 dia
    if (tasksUrgent) {
      for (const task of tasksUrgent) {
        try {
          // Usar predicted_end_date (prevista) se existir, senão end_date (planejada)
          const deadlineDate = task.predicted_end_date || task.end_date
          
          // Validar se a tarefa tem data de vencimento
          if (!deadlineDate) {
            console.warn(`⚠️ Tarefa ${task.id} (${task.name}) não possui data de vencimento, pulando notificação`)
            continue
          }

          const dateType = task.predicted_end_date ? 'prevista' : 'planejada'
          console.log(`📝 Processando tarefa urgente: ${task.name} (ID: ${task.id}, Status: ${task.status}, Data fim ${dateType}: ${deadlineDate})`)

          const { data: responsavel } = await supabase
            .from('responsaveis')
            .select('id')
            .eq('nome', task.responsible)
            .single()

          if (responsavel) {
            await notificationService.notifyResponsavelDeadlineUrgent(
              responsavel.id,
              task.name,
              deadlineDate,
              task.project_id,
              task.id
            )
            results.urgent++
          }
        } catch (error) {
          console.error(`Erro ao notificar urgência para tarefa ${task.id}:`, error)
          results.errors.push(`Urgência tarefa ${task.id}: ${error}`)
        }
      }
    }

    // Processar tarefas atrasadas
    console.log(`📋 Tarefas atrasadas: ${tasksOverdue?.length || 0}`)
    if (tasksOverdue) {
      for (const task of tasksOverdue) {
        try {
          // Usar predicted_end_date (prevista) se existir, senão end_date (planejada)
          const deadlineDate = task.predicted_end_date || task.end_date
          
          // Validar se a tarefa tem data de vencimento
          if (!deadlineDate) {
            console.warn(`⚠️ Tarefa ${task.id} (${task.name}) não possui data de vencimento, pulando notificação`)
            continue
          }

          const dateType = task.predicted_end_date ? 'prevista' : 'planejada'
          console.log(`📝 Processando tarefa atrasada: ${task.name} (ID: ${task.id}, Status: ${task.status}, Data fim ${dateType}: ${deadlineDate})`)
          
          const { data: responsavel } = await supabase
            .from('responsaveis')
            .select('id')
            .eq('nome', task.responsible)
            .single()
          
          console.log(`👤 Responsável encontrado: ${responsavel?.id || 'NÃO ENCONTRADO'}`)

          if (responsavel) {
            console.log(`🔄 Atualizando status da tarefa ${task.id} para 'overdue'`)
            
            // Atualizar status para atrasada
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ status: 'overdue' })
              .eq('id', task.id)

            if (updateError) {
              console.error(`❌ Erro ao atualizar status da tarefa ${task.id}:`, updateError)
            } else {
              console.log(`✅ Status da tarefa ${task.id} atualizado para 'overdue'`)
            }

            // Notificar responsável
            await notificationService.notifyResponsavelTaskOverdue(
              responsavel.id,
              task.name,
              deadlineDate,
              task.project_id,
              task.id
            )
            results.overdue++
          }
        } catch (error) {
          console.error(`Erro ao processar tarefa atrasada ${task.id}:`, error)
          results.errors.push(`Atrasada tarefa ${task.id}: ${error}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoramento de prazos executado',
      results
    })

  } catch (error) {
    console.error('Erro no monitoramento de prazos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
