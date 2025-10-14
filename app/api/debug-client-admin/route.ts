import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG CLIENT ADMIN API ===')
    const supabase = await createClient()
    
    // Buscar usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Usuário não autenticado',
        userError 
      }, { status: 401 })
    }
    
    console.log('👤 User encontrado:', {
      id: user.id,
      email: user.email
    })
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()
    
    console.log('👤 Profile encontrado:', profile)
    
    if (profileError) {
      return NextResponse.json({ 
        error: 'Erro ao obter perfil',
        profileError 
      }, { status: 500 })
    }
    
    let result = {
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      clientAdmin: null,
      company: null,
      tenantId: null
    }
    
    if (profile?.is_client_admin) {
      console.log('🔍 Buscando Client Admin...')
      
      // Buscar client admin
      const { data: clientAdmin, error: clientAdminError } = await supabase
        .from('client_admins')
        .select('id, company_id, email')
        .eq('id', user.id)
        .single()
      
      console.log('🔍 Client Admin resultado:', {
        data: clientAdmin,
        error: clientAdminError
      })
      
      result.clientAdmin = clientAdmin
      
      if (clientAdminError) {
        result.error = 'Erro ao buscar client_admin'
        result.clientAdminError = clientAdminError
      } else if (clientAdmin) {
        // Buscar empresa associada
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, tenant_id')
          .eq('tenant_id', clientAdmin.company_id)
          .single()
        
        console.log('🏢 Company resultado:', {
          data: company,
          error: companyError
        })
        
        result.company = company
        result.tenantId = clientAdmin.company_id
        
        if (companyError) {
          result.error = 'Erro ao buscar company'
          result.companyError = companyError
        }
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Erro na API debug:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error 
    }, { status: 500 })
  }
}
