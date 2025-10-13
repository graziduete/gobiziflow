import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { sendEmail } from "@/lib/email-server"
import { emailTemplates } from "@/lib/email-templates"

interface CreateAdminData {
  company_id: string
  full_name: string
  email: string
  status: "active" | "inactive"
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [ClientAdminAPI] Iniciando criação de administrador")
    
    // Criar cliente Supabase com service role para bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll(cookiesToSet) {
            // Não fazer nada - service role não precisa de cookies
          },
        },
      }
    )
    console.log("✅ [ClientAdminAPI] Cliente Supabase criado")

    // Verificar se o usuário é admin_master através dos cookies da requisição
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Não fazer nada - apenas leitura
          },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    console.log("🔍 [ClientAdminAPI] Usuário:", user?.id ? "Autenticado" : "Não autenticado")
    
    if (!user) {
      console.log("❌ [ClientAdminAPI] Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile, error: profileCheckError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("🔍 [ClientAdminAPI] Perfil:", { profile, error: profileCheckError })

    if (profileCheckError) {
      console.log("❌ [ClientAdminAPI] Erro ao buscar perfil:", profileCheckError)
      return NextResponse.json({ error: "Erro ao verificar permissões" }, { status: 500 })
    }

    if (profile?.role !== "admin_master") {
      console.log("❌ [ClientAdminAPI] Usuário não é admin_master. Role:", profile?.role)
      return NextResponse.json({ error: "Acesso negado. Apenas Admin Master pode criar administradores." }, { status: 403 })
    }

    console.log("✅ [ClientAdminAPI] Usuário autorizado como admin_master")

    let adminData: CreateAdminData
    try {
      adminData = await request.json()
      console.log("📝 [ClientAdminAPI] Dados recebidos:", adminData)
    } catch (jsonError) {
      console.log("❌ [ClientAdminAPI] Erro ao fazer parse do JSON:", jsonError)
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Validar dados obrigatórios
    if (!adminData.email || !adminData.full_name || !adminData.company_id) {
      console.log("❌ [ClientAdminAPI] Dados obrigatórios ausentes:", {
        email: !!adminData.email,
        full_name: !!adminData.full_name,
        company_id: !!adminData.company_id,
        receivedData: adminData
      })
      return NextResponse.json({ error: "Dados obrigatórios ausentes" }, { status: 400 })
    }

    // Validar se a empresa existe
    const { data: companyCheck, error: companyCheckError } = await supabase
      .from("client_companies")
      .select("id")
      .eq("id", adminData.company_id)
      .single()

    if (companyCheckError || !companyCheck) {
      console.log("❌ [ClientAdminAPI] Empresa não encontrada:", {
        company_id: adminData.company_id,
        error: companyCheckError
      })
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 400 })
    }

    console.log("✅ [ClientAdminAPI] Validações passaram, prosseguindo com criação")

    // 1. Buscar dados da empresa para o email
    console.log("🏢 [ClientAdminAPI] Buscando dados da empresa...")
    const { data: company, error: companyError } = await supabase
      .from("client_companies")
      .select("type, corporate_name, full_name")
      .eq("id", adminData.company_id)
      .single()

    if (companyError || !company) {
      console.error("❌ [ClientAdminAPI] Erro ao buscar empresa:", companyError)
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 400 })
    }

    console.log("✅ [ClientAdminAPI] Empresa encontrada:", company.type === "PJ" ? company.corporate_name : company.full_name)

    // 2. Verificar se já existe um admin com este email para esta empresa
    console.log("🔍 [ClientAdminAPI] Verificando se admin já existe...")
    const { data: existingAdmin, error: checkError } = await supabase
      .from("client_admins")
      .select("id")
      .eq("email", adminData.email)
      .eq("company_id", adminData.company_id)
      .single()

    if (existingAdmin) {
      console.log("❌ [ClientAdminAPI] Admin já existe para esta empresa")
      return NextResponse.json({ error: "Já existe um administrador com este e-mail para esta empresa" }, { status: 400 })
    }

    // 3. Criar usuário no Supabase Auth (com senha temporária)
    console.log("🔐 [ClientAdminAPI] Criando usuário no Supabase Auth...")
    const tempPassword = generateTemporaryPassword()
    
    console.log("🔐 [ClientAdminAPI] Senha temporária gerada:", tempPassword)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      email_confirm: true,
      password: tempPassword,
      user_metadata: {
        full_name: adminData.full_name,
        company_id: adminData.company_id,
        is_client_admin: true, // Marcar como client admin
        first_login: true // Marcar para primeiro login
      }
    })

    if (authError) {
      console.error("❌ [ClientAdminAPI] Erro ao criar usuário auth:", authError)
      
      // Se o erro for email já existe, buscar usuário existente
      if (authError.message.includes("already been registered")) {
        console.log("🔄 [ClientAdminAPI] Email já existe, buscando usuário existente...")
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const user = existingUser?.users?.find((u: any) => u.email === adminData.email)
        
        if (user) {
          console.log(`🔄 [ClientAdminAPI] Usando usuário existente: ${user.id}`)
          authData.user = user
        } else {
          return NextResponse.json({ error: "Este e-mail já está cadastrado no sistema" }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    const userId = authData?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Falha ao obter ID do usuário" }, { status: 500 })
    }

    console.log("✅ [ClientAdminAPI] Usuário criado no Auth:", userId)

    // 4. Criar perfil na tabela profiles (como admin normal, mas com flag especial)
    console.log("👤 [ClientAdminAPI] Criando perfil na tabela profiles...")
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: adminData.full_name,
        email: adminData.email,
        role: "admin", // Role admin (mesmo dos admins do sistema)
        is_client_admin: true, // Flag especial para identificar client admins
        first_login_completed: false, // Flag para primeiro login
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error("❌ [ClientAdminAPI] Erro ao criar perfil:", profileError)
      console.error("❌ [ClientAdminAPI] Detalhes do erro:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      return NextResponse.json({ 
        error: "Erro ao criar perfil do usuário", 
        details: profileError.message 
      }, { status: 500 })
    }

    console.log("✅ [ClientAdminAPI] Perfil criado:", profileData.id)

    // 5. Criar registro na tabela client_admins
    console.log("📋 [ClientAdminAPI] Criando registro na tabela client_admins...")
    console.log("📋 [ClientAdminAPI] Dados para inserção:", {
      id: userId,
      company_id: adminData.company_id,
      full_name: adminData.full_name,
      email: adminData.email,
      status: adminData.status
    })
    
    let adminRecord: any = null
    
    try {
      const { data: adminRecordData, error: adminError } = await supabase
        .from("client_admins")
        .insert({
          id: userId, // Usar o mesmo ID do auth
          company_id: adminData.company_id,
          full_name: adminData.full_name,
          email: adminData.email,
          status: adminData.status
        })
        .select()
        .single()

      console.log("📋 [ClientAdminAPI] Resultado da inserção:", { adminRecord: adminRecordData, adminError })

      if (adminError) {
        console.error("❌ [ClientAdminAPI] Erro ao criar registro admin:", adminError)
        console.error("❌ [ClientAdminAPI] Detalhes do erro:", {
          message: adminError.message,
          details: adminError.details,
          hint: adminError.hint,
          code: adminError.code
        })
        console.error("❌ [ClientAdminAPI] Dados que tentaram ser inseridos:", {
          id: userId,
          company_id: adminData.company_id,
          full_name: adminData.full_name,
          email: adminData.email,
          status: adminData.status
        })
        return NextResponse.json({ error: `Erro ao criar registro de administrador: ${adminError.message}` }, { status: 500 })
      }

      adminRecord = adminRecordData
      console.log("✅ [ClientAdminAPI] Registro client_admins criado:", adminRecord.id)
    } catch (insertError) {
      console.error("❌ [ClientAdminAPI] Erro geral na inserção:", insertError)
      return NextResponse.json({ error: `Erro geral na inserção: ${insertError}` }, { status: 500 })
    }

    // 6. Enviar email com credenciais de acesso
    const companyName = company.type === "PJ" 
      ? company.corporate_name 
      : company.full_name

    console.log("📧 [ClientAdminAPI] Enviando email com credenciais...")
    
    const emailTemplate = emailTemplates.newUserCredentials({
      fullName: adminData.full_name,
      email: adminData.email,
      password: tempPassword,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      companyName: companyName
    })
    
    const emailResult = await sendEmail({
      to: adminData.email,
      ...emailTemplate
    })

    if (!emailResult.success) {
      console.error(`❌ [ClientAdminAPI] Falha ao enviar email para ${adminData.email}:`, emailResult.error)
      // Não falhamos a criação por causa do email, mas logamos o erro
    } else {
      console.log(`✅ [ClientAdminAPI] Email com credenciais enviado com sucesso para ${adminData.email}`)
    }

    console.log(`✅ [ClientAdminAPI] Administrador criado com sucesso: ${adminData.email}`)

    const responseData = { 
      success: true, 
      message: "Administrador criado com sucesso! E-mail com credenciais enviado.",
      data: {
        admin: adminRecord,
        profile: profileData,
        authUser: authData?.user
      }
    }

    console.log("📤 [ClientAdminAPI] Resposta da API:", responseData)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("❌ [ClientAdminAPI] Erro geral:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    }, { status: 500 })
  }
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Garantir pelo menos um caractere de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Maiúscula
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Minúscula
  password += '0123456789'[Math.floor(Math.random() * 10)] // Número
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Símbolo
  
  // Completar com caracteres aleatórios
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

