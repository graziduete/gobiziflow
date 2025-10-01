import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-server'

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json()
    
    const result = await sendEmail(emailData)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na API de envio de email:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}