import { NextRequest, NextResponse } from 'next/server'
import { formatDateBrazil } from '@/lib/utils/status-translation'

/**
 * Endpoint para testar formatação de data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const testDate = body.date || '2025-11-18'
    
    console.log('🧪 Testando formatação de data:', testDate)
    
    // Testar função utilitária
    const formattedUtil = formatDateBrazil(testDate)
    console.log('📅 Resultado formatDateBrazil:', formattedUtil)
    
    // Testar formatação manual
    let formattedManual = ''
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
        const dateUTC = new Date(testDate + 'T00:00:00Z')
        if (!isNaN(dateUTC.getTime())) {
          formattedManual = new Intl.DateTimeFormat('pt-BR', { 
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(dateUTC)
        }
      }
    } catch (error) {
      console.error('Erro na formatação manual:', error)
    }
    
    return NextResponse.json({
      success: true,
      input: testDate,
      formattedUtil,
      formattedManual,
      isValid: formattedUtil && formattedUtil.trim() !== '' && formattedUtil !== 'Data não informada'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

