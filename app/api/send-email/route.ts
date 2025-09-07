import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    // Validate required fields
    if (!to || !subject || !html || !text) {
      return NextResponse.json(
        { error: "Campos obrigatórios: to, subject, html, text" },
        { status: 400 }
      )
    }

    console.log("📧 Tentando enviar email para:", to)
    console.log("🔧 Configurações Gmail:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? "***" : "NÃO DEFINIDA"
    })

    // Try multiple Gmail configurations
    let transporter
    let connectionVerified = false

    // Configuration 1: Standard Gmail
    try {
      console.log("🔍 Tentativa 1: Configuração padrão Gmail...")
      transporter = nodemailer.createTransport({
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
      
      await transporter.verify()
      console.log("✅ Conexão Gmail padrão verificada com sucesso")
      connectionVerified = true
    } catch (error1) {
               console.log("❌ Tentativa 1 falhou:", error1 instanceof Error ? error1.message : 'Erro desconhecido')
      
      // Configuration 2: Gmail with SSL
      try {
        console.log("🔍 Tentativa 2: Gmail com SSL...")
        transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        })
        
        await transporter.verify()
        console.log("✅ Conexão Gmail SSL verificada com sucesso")
        connectionVerified = true
      } catch (error2) {
                 console.log("❌ Tentativa 2 falhou:", error2 instanceof Error ? error2.message : 'Erro desconhecido')
         
         // Configuration 3: Manual Gmail
         try {
           console.log("🔍 Tentativa 3: Gmail manual...")
           transporter = nodemailer.createTransport({
             host: "smtp.gmail.com",
             port: 587,
             secure: false,
             auth: {
               user: process.env.SMTP_USER,
               pass: process.env.SMTP_PASS,
             },
             requireTLS: true,
             tls: {
               rejectUnauthorized: false
             }
           })
           
           await transporter.verify()
           console.log("✅ Conexão Gmail manual verificada com sucesso")
           connectionVerified = true
         } catch (error3) {
           console.log("❌ Todas as tentativas Gmail falharam")
           const error1Msg = error1 instanceof Error ? error1.message : 'Erro desconhecido'
           const error2Msg = error2 instanceof Error ? error2.message : 'Erro desconhecido'
           const error3Msg = error3 instanceof Error ? error3.message : 'Erro desconhecido'
           throw new Error(`Gmail falhou: ${error1Msg} | ${error2Msg} | ${error3Msg}`)
         }
      }
    }

    if (!connectionVerified) {
      throw new Error("Não foi possível verificar conexão Gmail")
    }

    // Send email
    console.log("📤 Enviando email via Gmail...")
    const info = await transporter.sendMail({
      from: `"Sistema de Projetos" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
    })

    console.log("📧 Email enviado com sucesso via Gmail:", {
      messageId: info.messageId,
      to: to,
      subject: subject,
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: "Email enviado com sucesso via Gmail" 
    })

  } catch (error: any) {
    console.error("❌ Falha ao enviar email via Gmail:", error)
    
    return NextResponse.json(
      { error: error.message || "Falha ao enviar email" },
      { status: 500 }
    )
  }
} 