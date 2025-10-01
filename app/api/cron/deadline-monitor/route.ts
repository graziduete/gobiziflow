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
    const { data: tasksWarning, error: warningError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', threeDaysFromNow.toISOString().split('T')[0])

    if (warningError) {
      console.error('Erro ao buscar tarefas para aviso:', warningError)
    }

    // Buscar tarefas que vencem em 1 dia (urgente)
    const { data: tasksUrgent, error: urgentError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', oneDayFromNow.toISOString().split('T')[0])

    if (urgentError) {
      console.error('Erro ao buscar tarefas urgentes:', urgentError)
    }

    // Buscar tarefas atrasadas
    const { data: tasksOverdue, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        end_date,
        status,
        responsible,
        project_id,
        projects!inner(name)
      `)
      .eq('status', 'in_progress')
      .lt('end_date', today.toISOString().split('T')[0])

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
          console.log(`📝 Processando tarefa de aviso: ${task.name} (ID: ${task.id}, Status: ${task.status}, Data fim: ${task.end_date})`)
          
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
              task.end_date,
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
          const { data: responsavel } = await supabase
            .from('responsaveis')
            .select('id')
            .eq('nome', task.responsible)
            .single()

          if (responsavel) {
            await notificationService.notifyResponsavelDeadlineUrgent(
              responsavel.id,
              task.name,
              task.end_date,
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
          console.log(`📝 Processando tarefa atrasada: ${task.name} (ID: ${task.id}, Status: ${task.status}, Data fim: ${task.end_date})`)
          
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
              task.end_date,
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
