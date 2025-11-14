import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notification.service'

/**
 * Endpoint para testar o fluxo completo de notificação
 * REMOVER após testes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const taskId = body.taskId || '17b1a50c-453f-47d2-bf72-392cf42af731'
    
    console.log('🧪 [TestFlow] Iniciando teste de notificação para tarefa:', taskId)
    
    // Simular o mesmo fluxo da rota de teste
    const result = await notificationService.notifyResponsavelDeadlineWarning(
      'd4887ed1-a52e-4ae0-b427-46810f97fe4c', // ID do responsável
      'Planejar',
      '2025-11-18',
      'project-id-placeholder',
      taskId
    )
    
    console.log('🧪 [TestFlow] Resultado:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Teste de fluxo de notificação executado',
      result,
      note: 'Verifique os logs do servidor para ver se o email foi enviado'
    })
  } catch (error) {
    console.error('❌ [TestFlow] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

