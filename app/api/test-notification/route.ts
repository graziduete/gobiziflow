import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Buscar todos os responsáveis primeiro (sem RLS)
    const { data: responsaveis, error: listError } = await supabase
      .from('responsaveis')
      .select('id, nome, email, empresa')
      .limit(5)
      .maybeSingle()

    if (listError) {
      return NextResponse.json({ error: `Erro ao listar responsáveis: ${listError.message}` })
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
