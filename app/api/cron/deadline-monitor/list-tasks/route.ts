import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

/**
 * Rota para listar tarefas que podem ser testadas
 * 
 * GET /api/cron/deadline-monitor/list-tasks
 * 
 * Retorna lista de tarefas com informações necessárias para teste
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Buscar tarefas com status in_progress e que tenham data
    const { data: tasks, error } = await supabase
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
      .order('end_date', { ascending: true })
      .limit(50) // Limitar a 50 tarefas
    
    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar tarefas', details: error.message },
        { status: 500 }
      )
    }
    
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma tarefa encontrada',
        tasks: [],
        usage: {
          test: 'POST /api/cron/deadline-monitor/test com body: { "taskId": "uuid-aqui" }',
          example: 'curl -X POST http://localhost:3000/api/cron/deadline-monitor/test -H "Content-Type: application/json" -d \'{"taskId": "uuid-aqui"}\''
        }
      })
    }
    
    // Calcular dias até vencimento e tipo de notificação
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tasksWithInfo = tasks.map(task => {
      const deadlineDate = task.predicted_end_date || task.end_date
      if (!deadlineDate) return null
      
      const deadline = new Date(deadlineDate + 'T00:00:00')
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let notificationType: string = 'fora_do_prazo'
      if (daysUntilDeadline < 0) {
        notificationType = 'atrasada'
      } else if (daysUntilDeadline === 0 || daysUntilDeadline === 1) {
        notificationType = 'urgente'
      } else if (daysUntilDeadline <= 3) {
        notificationType = 'aviso'
      }
      
      return {
        id: task.id,
        name: task.name,
        project: task.projects?.name || 'Projeto não encontrado',
        responsible: task.responsible || 'Não definido',
        end_date: task.end_date,
        predicted_end_date: task.predicted_end_date,
        deadline_used: deadlineDate,
        deadline_type: task.predicted_end_date ? 'prevista' : 'planejada',
        days_until_deadline: daysUntilDeadline,
        notification_type: notificationType,
        can_test: notificationType !== 'fora_do_prazo'
      }
    }).filter(Boolean)
    
    return NextResponse.json({
      success: true,
      total: tasksWithInfo.length,
      tasks: tasksWithInfo,
      usage: {
        test: 'POST /api/cron/deadline-monitor/test com body: { "taskId": "uuid-da-tarefa" }',
        example: `curl -X POST http://localhost:3000/api/cron/deadline-monitor/test -H "Content-Type: application/json" -d '{"taskId": "${tasksWithInfo[0]?.id || 'uuid-aqui'}"}'`
      }
    })
    
  } catch (error) {
    console.error('Erro ao listar tarefas:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

