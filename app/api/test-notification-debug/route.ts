import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/services/notification.service'
import { sendEmail } from '@/lib/email-server'

/**
 * Endpoint de debug para testar notificação com logs detalhados
 */
export async function POST(request: NextRequest) {
  const logs: string[] = []
  
  const addLog = (msg: string) => {
    console.log(msg)
    logs.push(`${new Date().toISOString()} - ${msg}`)
  }
  
  try {
    const body = await request.json().catch(() => ({}))
    const taskId = body.taskId || '17b1a50c-453f-47d2-bf72-392cf42af731'
    
    addLog('🧪 Iniciando teste de notificação')
    addLog(`📋 TaskId: ${taskId}`)
    
    const supabase = createClient()
    
    // Buscar tarefa
    addLog('🔍 Buscando tarefa...')
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
      return NextResponse.json({
        success: false,
        error: 'Tarefa não encontrada',
        logs
      }, { status: 404 })
    }
    
    addLog(`✅ Tarefa encontrada: ${task.name}`)
    
    // Buscar responsável
    addLog(`👤 Buscando responsável: ${task.responsible}`)
    const { data: responsavel } = await supabase
      .from('responsaveis')
      .select('id, nome, email')
      .eq('nome', task.responsible)
      .single()
    
    if (!responsavel) {
      return NextResponse.json({
        success: false,
        error: 'Responsável não encontrado',
        logs
      }, { status: 404 })
    }
    
    addLog(`✅ Responsável encontrado: ${responsavel.nome} (${responsavel.email})`)
    
    // Verificar variáveis de ambiente
    addLog('🔧 Verificando variáveis de ambiente...')
    addLog(`  NODE_ENV: ${process.env.NODE_ENV}`)
    addLog(`  ALLOW_EMAILS_IN_DEV: ${process.env.ALLOW_EMAILS_IN_DEV}`)
    addLog(`  SMTP_USER: ${process.env.SMTP_USER ? 'Configurado' : 'NÃO CONFIGURADO'}`)
    addLog(`  SMTP_PASS: ${process.env.SMTP_PASS ? 'Configurado' : 'NÃO CONFIGURADO'}`)
    
    const deadlineDate = task.predicted_end_date || task.end_date
    addLog(`📅 Data de vencimento: ${deadlineDate}`)
    
    // Testar envio direto de email primeiro
    addLog('📧 Testando envio direto de email...')
    const testEmailResult = await sendEmail({
      to: responsavel.email,
      subject: '🧪 Teste Direto - Notificação',
      html: '<p>Este é um teste direto do sistema de notificações.</p>',
      text: 'Este é um teste direto do sistema de notificações.'
    })
    
    addLog(`📧 Resultado do teste direto: ${JSON.stringify(testEmailResult)}`)
    
    // Agora testar via notificationService
    addLog('📬 Testando via notificationService...')
    const notificationResult = await notificationService.notifyResponsavelDeadlineWarning(
      responsavel.id,
      task.name,
      deadlineDate,
      task.project_id,
      task.id
    )
    
    addLog(`📬 Resultado do notificationService: ${JSON.stringify(notificationResult)}`)
    
    return NextResponse.json({
      success: true,
      message: 'Teste completo executado',
      logs,
      results: {
        testEmail: testEmailResult,
        notification: notificationResult
      },
      details: {
        task: {
          name: task.name,
          deadline: deadlineDate
        },
        responsavel: {
          nome: responsavel.nome,
          email: responsavel.email
        }
      }
    })
    
  } catch (error) {
    addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    if (error instanceof Error && error.stack) {
      addLog(`Stack: ${error.stack}`)
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      logs
    }, { status: 500 })
  }
}

