import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API Receitas GET ===')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const client = searchParams.get('client')
    const type = searchParams.get('type')
    
    console.log('Filtros recebidos:', { year, month, client, type })
    
    // =====================================================
    // MULTI-TENANCY: Determinar tenant_id baseado no perfil
    // =====================================================
    
    // Buscar usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Erro ao obter perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao obter perfil do usuário' }, { status: 500 })
    }
    
    console.log('👤 Perfil do usuário:', {
      userId: user.id,
      role: profile?.role,
      isClientAdmin: profile?.is_client_admin
    })
    
    // Determinar tenant_id para filtro
    let tenantId = null
    
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id associado
      const { data: clientAdmin, error: clientAdminError } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdminError) {
        console.error('Erro ao obter client_admin:', clientAdminError)
        return NextResponse.json({ error: 'Erro ao obter dados do Client Admin' }, { status: 500 })
      }
      
      tenantId = clientAdmin?.company_id || null
      console.log('🏢 Client Admin - tenant_id:', tenantId)
    } else {
      // Admin Master/Normal/Operacional: ver apenas tenant_id = NULL
      tenantId = null
      console.log('👑 Admin Master/Normal - filtrando tenant_id = NULL')
    }
    
    // =====================================================
    // QUERY COM FILTRO DE TENANT
    // =====================================================
    
    let query = supabase
      .from('revenue_entries')
      .select('*')
      .order('date', { ascending: false })
    
    // Aplicar filtro de tenant
    if (tenantId === null) {
      // Admin Master/Normal: ver apenas registros sem tenant (tenant_id = NULL)
      query = query.is('tenant_id', null)
      console.log('🔍 Aplicando filtro: tenant_id IS NULL')
    } else {
      // Client Admin: ver apenas registros do seu tenant
      query = query.eq('tenant_id', tenantId)
      console.log('🔍 Aplicando filtro: tenant_id =', tenantId)
    }
    
    // Filtros
    if (year) {
      // Filtrar por ano usando range de datas
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }
    
    if (month) {
      query = query.eq('month', parseInt(month))
    }
    
    if (client) {
      query = query.ilike('client', `%${client}%`)
    }
    
    if (type) {
      query = query.ilike('type', `%${type}%`)
    }
    
    console.log('Executando query...')
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar receitas:', error)
      return NextResponse.json({ error: 'Erro ao buscar receitas', details: error }, { status: 500 })
    }
    
    console.log('Dados encontrados:', data?.length || 0, 'registros')
    console.log('Primeiro registro:', data?.[0])
    
    return NextResponse.json({ revenues: data || [] })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('Dados recebidos na API de receitas:', body)
    
    // =====================================================
    // MULTI-TENANCY: Determinar tenant_id para inserção
    // =====================================================
    
    // Buscar usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Erro ao obter perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao obter perfil do usuário' }, { status: 500 })
    }
    
    // Determinar tenant_id para inserção
    let tenantId = null
    
    if (profile?.is_client_admin) {
      console.log('🔍 [DEBUG] Client Admin detectado, buscando dados...')
      console.log('🔍 [DEBUG] User ID:', user.id)
      
      // Client Admin: buscar company_id associado
      const { data: clientAdmin, error: clientAdminError } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      console.log('🔍 [DEBUG] Resultado da busca client_admin:', {
        data: clientAdmin,
        error: clientAdminError,
        hasData: !!clientAdmin,
        companyId: clientAdmin?.company_id
      })
      
      if (clientAdminError) {
        console.error('❌ [DEBUG] Erro ao obter client_admin:', clientAdminError)
        console.error('❌ [DEBUG] Detalhes do erro:', {
          message: clientAdminError.message,
          details: clientAdminError.details,
          hint: clientAdminError.hint,
          code: clientAdminError.code
        })
        return NextResponse.json({ 
          error: 'Erro ao obter dados do Client Admin', 
          details: clientAdminError,
          userId: user.id 
        }, { status: 500 })
      }
      
      if (!clientAdmin) {
        console.error('❌ [DEBUG] Client Admin não encontrado na tabela client_admins')
        console.error('❌ [DEBUG] User ID buscado:', user.id)
        return NextResponse.json({ 
          error: 'Client Admin não encontrado na tabela client_admins', 
          userId: user.id 
        }, { status: 404 })
      }
      
      console.log('✅ [DEBUG] Client Admin encontrado:', clientAdmin)
      
      tenantId = clientAdmin?.company_id || null
      console.log('🏢 Client Admin criando receita - tenant_id:', tenantId)
      
      if (!tenantId) {
        console.warn('⚠️ [DEBUG] Client Admin sem company_id associado')
      }
    } else {
      // Admin Master/Normal/Operacional: tenant_id = NULL
      tenantId = null
      console.log('👑 Admin Master/Normal criando receita - tenant_id = NULL')
    }
    
    // Adicionar tenant_id aos dados
    const dataWithTenant = {
      ...body,
      tenant_id: tenantId
    }
    
    console.log('Dados com tenant_id:', dataWithTenant)
    
    const { data, error } = await supabase
      .from('revenue_entries')
      .insert([dataWithTenant])
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar receita:', error)
      return NextResponse.json({ error: 'Erro ao criar receita', details: error }, { status: 500 })
    }
    
    console.log('Receita criada com sucesso:', data)
    return NextResponse.json({ revenue: data })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID da receita é obrigatório' }, { status: 400 })
    }
    
    // =====================================================
    // MULTI-TENANCY: Verificar permissão de edição
    // =====================================================
    
    // Buscar usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Erro ao obter perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao obter perfil do usuário' }, { status: 500 })
    }
    
    // Determinar tenant_id para verificação
    let tenantId = null
    
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id associado
      const { data: clientAdmin, error: clientAdminError } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdminError) {
        console.error('Erro ao obter client_admin:', clientAdminError)
        return NextResponse.json({ error: 'Erro ao obter dados do Client Admin' }, { status: 500 })
      }
      
      tenantId = clientAdmin?.company_id || null
    }
    
    // Construir query com filtro de tenant
    let query = supabase
      .from('revenue_entries')
      .update(updateData)
      .eq('id', id)
    
    // Aplicar filtro de tenant
    if (tenantId === null) {
      // Admin Master/Normal: só pode editar registros sem tenant
      query = query.is('tenant_id', null)
    } else {
      // Client Admin: só pode editar registros do seu tenant
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data, error } = await query.select().single()
    
    if (error) {
      console.error('Erro ao atualizar receita:', error)
      return NextResponse.json({ error: 'Erro ao atualizar receita', details: error }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Receita não encontrada ou sem permissão para editar' }, { status: 404 })
    }
    
    return NextResponse.json({ revenue: data })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da receita é obrigatório' }, { status: 400 })
    }
    
    // =====================================================
    // MULTI-TENANCY: Verificar permissão de exclusão
    // =====================================================
    
    // Buscar usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Erro ao obter perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao obter perfil do usuário' }, { status: 500 })
    }
    
    // Determinar tenant_id para verificação
    let tenantId = null
    
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id associado
      const { data: clientAdmin, error: clientAdminError } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdminError) {
        console.error('Erro ao obter client_admin:', clientAdminError)
        return NextResponse.json({ error: 'Erro ao obter dados do Client Admin' }, { status: 500 })
      }
      
      tenantId = clientAdmin?.company_id || null
    }
    
    // Construir query com filtro de tenant
    let query = supabase
      .from('revenue_entries')
      .delete()
      .eq('id', id)
    
    // Aplicar filtro de tenant
    if (tenantId === null) {
      // Admin Master/Normal: só pode deletar registros sem tenant
      query = query.is('tenant_id', null)
    } else {
      // Client Admin: só pode deletar registros do seu tenant
      query = query.eq('tenant_id', tenantId)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Erro ao deletar receita:', error)
      return NextResponse.json({ error: 'Erro ao deletar receita', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}
