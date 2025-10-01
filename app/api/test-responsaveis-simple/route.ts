import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 [Test] Iniciando teste simples de responsaveis...')
    
    // Teste 1: Verificar se consegue conectar
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1)
    
    if (testError) {
      console.error('🔍 [Test] Erro ao conectar com Supabase:', testError)
      return NextResponse.json({ error: `Erro de conexão: ${testError.message}` })
    }
    
    console.log('🔍 [Test] Conexão com Supabase OK')
    
    // Teste 2: Tentar acessar responsaveis sem RLS
    const { data: responsaveis, error: responsaveisError } = await supabase
      .from('responsaveis')
      .select('id, nome, email')
      .limit(5)
    
    console.log('🔍 [Test] Resultado da consulta responsaveis:', { responsaveis, error: responsaveisError })
    
    if (responsaveisError) {
      return NextResponse.json({ 
        error: `Erro ao buscar responsaveis: ${responsaveisError.message}`,
        code: responsaveisError.code,
        details: responsaveisError.details
      })
    }
    
    return NextResponse.json({
      success: true,
      responsaveis: responsaveis || [],
      count: responsaveis?.length || 0,
      testData: testData || []
    })

  } catch (error) {
    console.error('🔍 [Test] Erro geral:', error)
    return NextResponse.json({ error: `Erro: ${error}` })
  }
}
