import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/services/notification.service'

/**
 * Rota de teste para notificar uma tarefa específica
 * 
 * Uso:
 * POST /api/cron/deadline-monitor/test
 * Body: { "taskId": "uuid-da-tarefa" }
 * 
 * Ou via query:
 * GET /api/cron/deadline-monitor/test?taskId=uuid-da-tarefa
 */
export async function GET(request: NextRequest) {
  return await testTaskNotification(request)
}

export async function POST(request: NextRequest) {
  return await testTaskNotification(request)
}

async function testTaskNotification(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Obter taskId e force do body (POST) ou query (GET)
    let taskId: string | null = null
    let force: boolean = false
    
    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      taskId = body.taskId || null
      force = body.force === true || body.force === 'true'
    } else {
      const { searchParams } = new URL(request.url)
      taskId = searchParams.get('taskId')
      force = searchParams.get('force') === 'true'
    }
    
    if (!taskId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'taskId é obrigatório',
          usage: {
            POST: 'POST /api/cron/deadline-monitor/test com body: { "taskId": "uuid-da-tarefa", "force": true }',
            GET: 'GET /api/cron/deadline-monitor/test?taskId=uuid-da-tarefa&force=true',
            note: 'Use "force": true para testar tarefas fora do período de notificação (mais de 3 dias)'
          }
        },
        { status: 400 }
      )
    }
    
    console.log(`🧪 [Test] Buscando tarefa ${taskId} para teste de notificação...`)
    
    // Buscar tarefa
    const { data: task, error: taskError } = await supabase
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
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tarefa não encontrada',
          details: taskError?.message 
        },
        { status: 404 }
      )
    }
    
    console.log(`✅ [Test] Tarefa encontrada: ${task.name}`)
    console.log(`📅 [Test] Data fim planejada: ${task.end_date}`)
    console.log(`📅 [Test] Data fim prevista: ${task.predicted_end_date || 'Não definida'}`)
    
    // Validar se a tarefa tem data de vencimento
    const deadlineDate = task.predicted_end_date || task.end_date
    if (!deadlineDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tarefa não possui data de vencimento',
          task: {
            id: task.id,
            name: task.name,
            end_date: task.end_date,
            predicted_end_date: task.predicted_end_date
          }
        },
        { status: 400 }
      )
    }
    
    // Buscar responsável
    if (!task.responsible) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tarefa não possui responsável definido',
          task: {
            id: task.id,
            name: task.name,
            responsible: task.responsible
          }
        },
        { status: 400 }
      )
    }
    
    const { data: responsavel, error: responsavelError } = await supabase
      .from('responsaveis')
      .select('id, nome, email')
      .eq('nome', task.responsible)
      .single()
    
    if (responsavelError || !responsavel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Responsável não encontrado',
          details: responsavelError?.message,
          task: {
            id: task.id,
            name: task.name,
            responsible: task.responsible
          }
        },
        { status: 404 }
      )
    }
    
    console.log(`👤 [Test] Responsável encontrado: ${responsavel.nome} (${responsavel.email})`)
    
    // Determinar tipo de notificação baseado na data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const deadline = new Date(deadlineDate + 'T00:00:00')
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    let notificationType: 'deadline_warning' | 'deadline_urgent' | 'task_overdue' | null = null
    let notificationMessage = ''
    
    if (daysUntilDeadline < 0) {
      // Tarefa atrasada
      notificationType = 'task_overdue'
      notificationMessage = `Tarefa está atrasada há ${Math.abs(daysUntilDeadline)} dia(s)`
    } else if (daysUntilDeadline === 0 || daysUntilDeadline === 1) {
      // Tarefa urgente (vence hoje ou amanhã)
      notificationType = 'deadline_urgent'
      notificationMessage = `Tarefa vence ${daysUntilDeadline === 0 ? 'hoje' : 'amanhã'}`
    } else if (daysUntilDeadline <= 3) {
      // Aviso (vence em 2-3 dias)
      notificationType = 'deadline_warning'
      notificationMessage = `Tarefa vence em ${daysUntilDeadline} dia(s)`
    } else {
      // Tarefa fora do período normal
      if (force) {
        // Modo forçado: simular como se fosse aviso
        notificationType = 'deadline_warning'
        notificationMessage = `[TESTE FORÇADO] Tarefa vence em ${daysUntilDeadline} dia(s) (normalmente não notificaria)`
        console.log(`⚠️ [Test] Modo FORÇADO ativado - tarefa está ${daysUntilDeadline} dias no futuro`)
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tarefa não está dentro do período de notificação',
            info: {
              daysUntilDeadline,
              deadlineDate,
              message: 'Notificações são enviadas apenas para tarefas que vencem em até 3 dias ou estão atrasadas',
              tip: 'Use "force": true no body para testar mesmo assim'
            }
          },
          { status: 400 }
        )
      }
    }
    
    console.log(`📬 [Test] Tipo de notificação: ${notificationType}`)
    console.log(`📬 [Test] ${notificationMessage}`)
    
    // Enviar notificação
    let notificationResult
    try {
      // Sempre ignorar verificação de duplicatas em testes
      const skipDuplicateCheck = true
      
      if (notificationType === 'task_overdue') {
        notificationResult = await notificationService.notifyResponsavelTaskOverdue(
          responsavel.id,
          task.name,
          deadlineDate,
          task.project_id,
          task.id,
          skipDuplicateCheck
        )
      } else if (notificationType === 'deadline_urgent') {
        notificationResult = await notificationService.notifyResponsavelDeadlineUrgent(
          responsavel.id,
          task.name,
          deadlineDate,
          task.project_id,
          task.id,
          skipDuplicateCheck
        )
      } else {
        notificationResult = await notificationService.notifyResponsavelDeadlineWarning(
          responsavel.id,
          task.name,
          deadlineDate,
          task.project_id,
          task.id,
          skipDuplicateCheck
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notificação de teste enviada com sucesso',
        forced: force && daysUntilDeadline > 3,
        details: {
          task: {
            id: task.id,
            name: task.name,
            end_date: task.end_date,
            predicted_end_date: task.predicted_end_date,
            deadline_used: deadlineDate,
            deadline_type: task.predicted_end_date ? 'prevista' : 'planejada'
          },
          responsavel: {
            id: responsavel.id,
            nome: responsavel.nome,
            email: responsavel.email
          },
          notification: {
            type: notificationType,
            message: notificationMessage,
            daysUntilDeadline,
            forced: force && daysUntilDeadline > 3
          }
        }
      })
    } catch (error) {
      console.error('❌ [Test] Erro ao enviar notificação:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao enviar notificação',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ [Test] Erro no teste de notificação:', error)
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

