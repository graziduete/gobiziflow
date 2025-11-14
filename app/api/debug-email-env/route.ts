import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint temporário para debug de variáveis de email
 * REMOVER após testes
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    ALLOW_EMAILS_IN_DEV: process.env.ALLOW_EMAILS_IN_DEV,
    DISABLE_EMAILS: process.env.DISABLE_EMAILS,
    SMTP_USER: process.env.SMTP_USER ? 'Configurado' : 'NÃO CONFIGURADO',
    SMTP_PASS: process.env.SMTP_PASS ? 'Configurado' : 'NÃO CONFIGURADO',
    shouldBlock: (process.env.NODE_ENV === 'development' || process.env.DISABLE_EMAILS === 'true') && process.env.ALLOW_EMAILS_IN_DEV !== 'true',
    willSendEmail: !((process.env.NODE_ENV === 'development' || process.env.DISABLE_EMAILS === 'true') && process.env.ALLOW_EMAILS_IN_DEV !== 'true')
  })
}

