import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/services/user.service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] Iniciando criação de usuário...')
    
    const body = await request.json()
    const { full_name, email, role, company_id } = body

    console.log('📝 [API] Dados recebidos para criação de usuário:', { full_name, email, role, company_id })

    // Validações básicas (company_id obrigatório apenas para clientes)
    if (!full_name || !email || !role || (role === 'client' && !company_id)) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar role
    if (!['client', 'admin', 'admin_operacional', 'admin_master'].includes(role)) {
      return NextResponse.json(
        { error: 'Tipo de usuário inválido' },
        { status: 400 }
      )
    }

    console.log('🔧 [API] Criando cliente Supabase...')
    const supabase = await createClient()
    console.log('✅ [API] Cliente Supabase criado')

    // Verificar se o email já existe (tanto no auth quanto no profiles)
    console.log('🔍 [API] Verificando se email já existe:', email)
    
    // Verificar na tabela profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    
    // Verificar no auth (usando service role)
    const { data: existingAuthUser, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const authUserExists = existingAuthUser?.users?.find(user => user.email === email)
    
    console.log('📊 [API] Resultado da verificação:', { 
      existingProfile: !!existingProfile, 
      profileError,
      authUserExists: !!authUserExists 
    })

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar email existente no profiles:', profileError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingProfile || authUserExists) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Verificar empresa apenas quando cliente
    let company: any = null
    if (role === 'client') {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', company_id)
        .single()
      if (companyError || !companyData) {
        console.error('❌ Empresa não encontrada:', companyError)
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 404 }
        )
      }
      company = companyData
    }

    // Usar o UserService para criar o usuário
    console.log('👤 [API] Chamando UserService.createUser...')
    const result = await userService.createUser({
      full_name,
      email,
      role,
      is_first_login: true,
      first_login_completed: false // Flag para primeiro login
    })
    console.log('✅ [API] UserService.createUser concluído:', { hasUser: !!result.user, hasPassword: !!result.password })

    if (!result.user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 500 }
      )
    }

    // Criar associação com a empresa (somente cliente)
    if (role === 'client' && company_id) {
      console.log('🏢 [API] Criando associação user_companies:', {
        user_id: result.user.id,
        company_id: company_id
      })
      
      const { error: companyError2 } = await supabase
        .from('user_companies')
        .insert({
          user_id: result.user.id,
          company_id: company_id
        })
        
      if (companyError2) {
        console.error('❌ [API] Erro ao associar usuário à empresa:', companyError2)
      } else {
        console.log('✅ [API] Associação user_companies criada com sucesso')
      }
    } else {
      console.log('⚠️ [API] Não criando associação user_companies:', { role, company_id })
    }

    console.log('✅ Usuário criado com sucesso:', {
      id: result.user.id,
      email,
      full_name,
      role,
      company: company?.name
    })

    // Email já foi enviado pelo UserService

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        full_name,
        email,
        role,
        company_id,
        company_name: company?.name,
        password: result.password // Para exibir no frontend se o email falhar
      }
    })

  } catch (error) {
    console.error('❌ [API] Erro inesperado na criação de usuário:', error)
    console.error('❌ [API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}