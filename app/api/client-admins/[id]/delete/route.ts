import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const adminId = params.id

    console.log(`🗑️ [ClientAdminAPI] Excluindo administrador: ${adminId}`)

    // Excluir registro da tabela client_admins (SEM mexer no Supabase Auth)
    const { error } = await supabase
      .from("client_admins")
      .delete()
      .eq("id", adminId)

    if (error) {
      console.error("❌ [ClientAdminAPI] Erro ao excluir admin:", error)
      return NextResponse.json({ error: "Erro ao excluir administrador" }, { status: 500 })
    }

    console.log(`✅ [ClientAdminAPI] Administrador excluído com sucesso: ${adminId}`)
    return NextResponse.json({ success: true, message: "Administrador excluído com sucesso" })

  } catch (error) {
    console.error("❌ [ClientAdminAPI] Erro ao excluir:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    }, { status: 500 })
  }
}
