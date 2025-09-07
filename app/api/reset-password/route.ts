import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar a senha usando o service role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    )

    if (updateError) {
      console.error("❌ Erro ao atualizar senha:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar senha" },
        { status: 500 }
      )
    }

    console.log("✅ Senha atualizada com sucesso para:", email)
    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso"
    })

  } catch (error) {
    console.error("❌ Erro na API de reset de senha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}