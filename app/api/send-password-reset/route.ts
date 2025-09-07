import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { emailTemplates } from "@/lib/email"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
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
      .select("id, full_name, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      console.log("❌ Usuário não encontrado:", email)
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json({
        success: true,
        message: "Se o email existir em nosso sistema, você receberá instruções de redefinição."
      })
    }

    // Gerar URL de redefinição
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`
    const resetUrl = `${baseUrl}/auth/reset-password?token=reset&email=${encodeURIComponent(email)}`

    // Enviar email personalizado usando nodemailer diretamente
    try {
      const emailSent = await sendPasswordResetEmail({
        to: email,
        fullName: user.full_name || "Usuário",
        resetUrl: resetUrl,
      })

      if (emailSent) {
        console.log("✅ Email de redefinição enviado para:", email)
        return NextResponse.json({
          success: true,
          message: "Instruções de redefinição enviadas para seu email."
        })
      } else {
        throw new Error("Falha ao enviar email")
      }
    } catch (emailError) {
      console.error("❌ Erro ao enviar email:", emailError)
      return NextResponse.json(
        { error: "Erro ao enviar email de redefinição" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("❌ Erro na API de redefinição:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Função para enviar email de redefinição de senha
async function sendPasswordResetEmail({ to, fullName, resetUrl }: {
  to: string
  fullName: string
  resetUrl: string
}): Promise<boolean> {
  try {
    console.log("📧 Enviando email de redefinição para:", to)

    // Configurar transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verificar conexão
    await transporter.verify()
    console.log("✅ Conexão SMTP verificada")

    // Gerar template de email
    const emailTemplate = emailTemplates.passwordReset({
      fullName,
      email: to,
      resetUrl,
    })

    // Enviar email
    const info = await transporter.sendMail({
      from: `"GobiZi Flow" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    console.log("✅ Email enviado com sucesso:", info.messageId)
    return true

  } catch (error) {
    console.error("❌ Erro ao enviar email:", error)
    return false
  }
}