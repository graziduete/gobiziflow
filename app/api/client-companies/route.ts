import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // Não fazer nada
          },
        },
      }
    )

    // Buscar empresas ativas
    const { data: companies, error: companiesError } = await supabase
      .from("client_companies")
      .select("id, type, corporate_name, full_name, email, licenses_quantity, status")
      .eq("status", "active")
      .order("corporate_name, full_name")

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    // Buscar contagem de admins por empresa
    const { data: adminCountsData, error: countsError } = await supabase
      .from("client_admins")
      .select("company_id")
      .eq("status", "active")

    if (countsError) {
      return NextResponse.json({ error: countsError.message }, { status: 500 })
    }

    // Processar contadores
    const counts: Record<string, number> = {}
    adminCountsData?.forEach(item => {
      counts[item.company_id] = (counts[item.company_id] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      companies: companies || [],
      adminCounts: counts
    })

  } catch (error) {
    console.error("Erro ao buscar empresas:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }, { status: 500 })
  }
}
