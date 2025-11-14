import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-server'

/**
 * Endpoint para testar envio de email diretamente
 * REMOVER após testes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const to = body.to || 'graziely@gobi.consulting'
    
    const result = await sendEmail({
      to,
      subject: '🧪 Teste de Email - GobiZi Flow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">🧪 Teste de Email</h2>
          <p>Este é um email de teste do sistema GobiZi Flow.</p>
          <p>Se você recebeu este email, o sistema de notificações está funcionando corretamente!</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Data/Hora: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
      text: `🧪 Teste de Email\n\nEste é um email de teste do sistema GobiZi Flow.\n\nSe você recebeu este email, o sistema de notificações está funcionando corretamente!\n\nData/Hora: ${new Date().toLocaleString('pt-BR')}`
    })
    
    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.success 
        ? 'Email enviado com sucesso! Verifique a caixa de entrada (e spam).' 
        : 'Erro ao enviar email: ' + (result.error || 'Erro desconhecido'),
      details: {
        to,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Erro ao processar requisição'
    }, { status: 500 })
  }
}

