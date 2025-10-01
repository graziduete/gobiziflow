import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notification.service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [API] Iniciando notificação para responsável...')
    
    const body = await request.json()
    console.log('🔔 [API] Dados recebidos:', body)
    
    const { 
      responsavelId, 
      type, 
      title, 
      message, 
      projectId, 
      taskId,
      taskDetails
    } = body

    if (!responsavelId || !type || !title || !message) {
      console.log('🔔 [API] Dados obrigatórios não fornecidos:', { responsavelId, type, title, message })
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Validar tipo de notificação
    const validTypes = ['project_assigned', 'deadline_warning', 'deadline_urgent', 'task_overdue']
    if (!validTypes.includes(type)) {
      console.log('🔔 [API] Tipo de notificação inválido:', type)
      return NextResponse.json(
        { error: 'Tipo de notificação inválido' },
        { status: 400 }
      )
    }

    console.log('🔔 [API] Chamando notificationService.notifyResponsavel...')
    
    // Enviar notificação
    const result = await notificationService.notifyResponsavel(
      responsavelId,
      type,
      title,
      message,
      projectId,
      taskId,
      taskDetails
    )

    console.log('🔔 [API] Notificação enviada com sucesso:', result)
    
    return NextResponse.json({ 
      success: true, 
      isRegistered: result.isRegistered 
    })

  } catch (error) {
    console.error('❌ [API] Erro ao enviar notificação para responsável:', error)
    console.error('❌ [API] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responsavelId = searchParams.get('responsavelId')

    if (!responsavelId) {
      return NextResponse.json(
        { error: 'ID do responsável é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se responsável é usuário registrado
    const result = await notificationService.isResponsavelRegistered(responsavelId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao verificar status do responsável:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
