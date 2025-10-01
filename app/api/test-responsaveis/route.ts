import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Buscar responsáveis
    const { data: responsaveis, error } = await supabase
      .from('responsaveis')
      .select('id, nome, email, empresa')
      .limit(10)

    if (error) {
      return NextResponse.json({ 
        error: `Erro ao buscar responsáveis: ${error.message}`,
        code: error.code,
        details: error.details
      })
    }

    return NextResponse.json({
      success: true,
      responsaveis,
      count: responsaveis?.length || 0
    })

  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json({ error: `Erro: ${error}` })
  }
}
