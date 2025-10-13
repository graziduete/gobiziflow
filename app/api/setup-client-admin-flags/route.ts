import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [SetupClientAdminFlags] Iniciando setup das flags de client_admin")

    // Criar cliente Supabase com service role para bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    // Verificar se o usuário é admin_master
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin_master") {
      return NextResponse.json({ error: "Acesso negado. Apenas Admin Master pode executar este script." }, { status: 403 })
    }

    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'scripts', '105_add_client_admin_flags.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log("📄 [SetupClientAdminFlags] Executando script SQL...")

    // Executar o script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error("❌ [SetupClientAdminFlags] Erro ao executar script:", error)
      return NextResponse.json({ error: `Erro ao executar script: ${error.message}` }, { status: 500 })
    }

    console.log("✅ [SetupClientAdminFlags] Script executado com sucesso!")

    return NextResponse.json({ 
      success: true, 
      message: "Flags de client_admin configuradas com sucesso!" 
    })

  } catch (error: any) {
    console.error("❌ [SetupClientAdminFlags] Erro inesperado:", error)
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor" 
    }, { status: 500 })
  }
}
