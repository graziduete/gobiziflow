import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !['admin', 'admin_master', 'admin_operacional'].includes(profile.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Atualizar o nome de "Stored Procedures" para "Procedures"
    const { data, error } = await supabase
      .from('tecnologias')
      .update({ nome: 'Procedures' })
      .eq('nome', 'Stored Procedures')
      .select()

    if (error) {
      console.error("Erro ao atualizar tecnologia:", error)
      return NextResponse.json({ error: "Erro ao atualizar tecnologia", details: error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Tecnologia renomeada com sucesso",
      data 
    })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor", details: error }, { status: 500 })
  }
}

