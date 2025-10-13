import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

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

    // Inserir dados de exemplo para testar
    const { data, error } = await supabase
      .from("client_companies")
      .insert([
        {
          type: "PJ",
          corporate_name: "Empresa Exemplo Ltda",
          cnpj: "12.345.678/0001-90",
          email: "contato@exemplo.com",
          cep: "01234-567",
          street: "Rua das Flores",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          plan_type: "plano_pro",
          licenses_quantity: 3,
          price_per_license: 19.90,
          total_value: 59.70,
          card_number: "1234 5678 9012 3456",
          card_name: "EMPRESA EXEMPLO LTDA",
          card_expiry: "12/25",
          card_cvv: "123",
          status: "active"
        }
      ])
      .select()

    if (error) {
      console.error("Erro ao inserir dados:", error)
      return NextResponse.json({ 
        error: "Erro ao inserir dados de exemplo", 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Dados de exemplo inseridos com sucesso!",
      data
    })

  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}