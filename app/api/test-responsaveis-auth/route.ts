import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 [TestAuth] Iniciando teste com autenticação...')
    
    // Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 [TestAuth] Usuário atual:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' })
    }
    
    // Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', user.id)
      .single()
    
    console.log('🔍 [TestAuth] Perfil do usuário:', { profile, error: profileError })
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' })
    }
    
    // Verificar se é admin
    if (!['admin', 'admin_operacional'].includes(profile.role)) {
      return NextResponse.json({ error: 'Usuário não é admin' })
    }
    
    // Tentar acessar responsaveis
    const { data: responsaveis, error: responsaveisError } = await supabase
      .from('responsaveis')
      .select('id, nome, email, empresa')
      .limit(5)
    
    console.log('🔍 [TestAuth] Resultado responsaveis:', { responsaveis, error: responsaveisError })
    
    if (responsaveisError) {
      return NextResponse.json({ 
        error: `Erro ao buscar responsaveis: ${responsaveisError.message}`,
        code: responsaveisError.code,
        details: responsaveisError.details
      })
    }
    
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      profile: { role: profile.role, full_name: profile.full_name },
      responsaveis: responsaveis || [],
      count: responsaveis?.length || 0
    })

  } catch (error) {
    console.error('🔍 [TestAuth] Erro geral:', error)
    return NextResponse.json({ error: `Erro: ${error}` })
  }
}
