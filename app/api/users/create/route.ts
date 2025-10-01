import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/services/user.service'
import { createClient } from '@/lib/supabase/client'
import { sendEmail, emailTemplates } from '@/lib/email-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, role, company_id } = body

    console.log('📝 Dados recebidos para criação de usuário:', { full_name, email, role, company_id })

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
    if (!['client', 'admin', 'admin_operacional'].includes(role)) {
      return NextResponse.json(
        { error: 'Tipo de usuário inválido' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verificar se o email já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar email existente:', checkError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (existingUser) {
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
    const result = await userService.createUser({
      full_name,
      email,
      role,
      is_first_login: true
    })

    if (!result.user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 500 }
      )
    }

    // Criar associação com a empresa (somente cliente)
    if (role === 'client' && company_id) {
      const { error: companyError2 } = await supabase
        .from('user_companies')
        .insert({
          user_id: result.user.id,
          company_id: company_id
        })
      if (companyError2) {
        console.error('❌ Erro ao associar usuário à empresa:', companyError2)
      }
    }

    console.log('✅ Usuário criado com sucesso:', {
      id: result.user.id,
      email,
      full_name,
      role,
      company: company?.name
    })

    // Enviar email com credenciais
    try {
      const emailSent = await sendEmail({
        to: email,
        ...emailTemplates.newUserCredentials({
          fullName: full_name,
          email: email,
          password: result.password,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          companyName: company?.name,
        })
      })

      console.log('📧 Email enviado:', emailSent)
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError)
      // Não vamos falhar a criação por causa do email
    }

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
    console.error('❌ Erro inesperado na criação de usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}