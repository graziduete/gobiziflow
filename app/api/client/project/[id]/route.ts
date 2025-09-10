import { createServerClient } from "@supabase/ssr"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })

    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("🔍 API Route - Usuário:", user?.id, "Erro:", userError)

    if (userError || !user) {
      console.log("❌ API Route - Usuário não autorizado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: userCompanies, error: userCompaniesError } = await supabase
      .from("user_companies")
      .select(`
        companies (
          id,
          name
        )
      `)
      .eq("user_id", user.id)

    if (userCompaniesError || !userCompanies || userCompanies.length === 0) {
      console.log("❌ API Route - Usuário não tem empresa associada:", userCompaniesError)
      return NextResponse.json({ error: "Usuário não tem empresa associada" }, { status: 403 })
    }

    const company = userCompanies[0].companies as any

    console.log("🔍 API Route - Empresa do usuário:", company)

    // Buscar projeto específico da empresa usando service client
    const { data: project, error: projectError } = await supabaseService
      .from("projects")
      .select("*")
      .eq("id", resolvedParams.id)
      .eq("company_id", company.id)
      .single()

    console.log("🔍 API Route - Resultado da consulta:", { project, projectError })

    if (projectError || !project) {
      console.log("❌ API Route - Projeto não encontrado:", projectError)
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    // Buscar dados da empresa separadamente
    const { data: companyData, error: companyError } = await supabaseService
      .from("companies")
      .select("*")
      .eq("id", company.id)
      .single()

    // Adicionar dados da empresa ao projeto
    const projectWithCompany = {
      ...project,
      companies: companyData
    }

    console.log("✅ API Route - Projeto encontrado:", project.name)
    return NextResponse.json({ project: projectWithCompany })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}