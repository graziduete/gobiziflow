import nodemailer from 'nodemailer'
import { EmailTemplate, emailTemplates } from './email-templates'

export interface EmailData {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 [EmailService] Enviando email para:', emailData.to)
    console.log('📧 [EmailService] Assunto:', emailData.subject)
    console.log('📧 [EmailService] SMTP_USER:', process.env.SMTP_USER ? 'Configurado' : 'NÃO CONFIGURADO')
    console.log('📧 [EmailService] SMTP_PASS:', process.env.SMTP_PASS ? 'Configurado' : 'NÃO CONFIGURADO')
    
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Variáveis de ambiente SMTP_USER e SMTP_PASS não estão configuradas')
    }
    
    // Configurar transporter usando o mesmo padrão do sistema existente
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

    console.log('📧 [EmailService] Transporter configurado, verificando conexão...')

    // Verificar conexão
    await transporter.verify()
    console.log('✅ [EmailService] Conexão SMTP verificada')

    console.log('📧 [EmailService] Enviando email...')
    // Enviar email
    const info = await transporter.sendMail({
      from: `"GobiZi Flow" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    console.log('✅ [EmailService] Email enviado com sucesso:', info.messageId)
    return { success: true }
    
  } catch (error) {
    console.error('❌ [EmailService] Erro ao enviar email:', error)
    console.error('❌ [EmailService] Detalhes do erro:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      responseCode: (error as any)?.responseCode,
      command: (error as any)?.command
    })
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export { emailTemplates }
