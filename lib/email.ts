import nodemailer from 'nodemailer'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

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
    let transporter = nodemailer.createTransporter({
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

const emailTemplates = {
  projectAssigned: (taskName: string, projectName: string, responsibleName: string): EmailTemplate => ({
    subject: `🎯 Nova Tarefa Atribuída - ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Tarefa Atribuída</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .welcome { 
            font-size: 18px; 
            color: #374151; 
            margin-bottom: 30px; 
            text-align: center; 
          }
          .task-box { 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
            border: 1px solid #e2e8f0; 
            border-radius: 16px; 
            padding: 30px; 
            margin: 25px 0; 
            text-align: center; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); 
          }
          .task-title { 
            font-size: 24px; 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 15px; 
          }
          .task-details { 
            margin: 20px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
          }
          .detail-item { 
            margin: 10px 0; 
            font-size: 16px; 
            color: #374151; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #1f2937; 
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); 
            color: white; 
            text-decoration: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 25px 0; 
            transition: transform 0.2s; 
          }
          .footer { 
            background-color: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Nova Tarefa Atribuída</h1>
            <p>Você foi designado para uma nova tarefa</p>
          </div>
          
          <div class="content">
            <div class="welcome">
              Olá <strong>${responsibleName}</strong>! 👋
            </div>
            
            <div class="task-box">
              <div class="task-title">${taskName}</div>
              <div class="task-details">
                <div class="detail-item">
                  <span class="detail-label">📋 Projeto:</span> ${projectName}
                </div>
                <div class="detail-item">
                  <span class="detail-label">👤 Responsável:</span> ${responsibleName}
                </div>
                <div class="detail-item">
                  <span class="detail-label">📅 Data:</span> ${new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            
            <p style="text-align: center; color: #6b7280; margin: 30px 0;">
              Acesse o sistema para mais detalhes sobre a tarefa e acompanhar o progresso.
            </p>
          </div>
          
          <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão de projetos.</p>
            <p>© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🎯 Nova Tarefa Atribuída\n\nOlá ${responsibleName}! 👋\n\nVocê foi designado para uma nova tarefa:\n\n📋 Tarefa: ${taskName}\n📋 Projeto: ${projectName}\n👤 Responsável: ${responsibleName}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\nAcesse o sistema para mais detalhes sobre a tarefa e acompanhar o progresso.\n\nEsta é uma notificação automática do sistema de gestão de projetos.\n\n© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.`
  }),

  deadlineWarning: (taskName: string, endDate: string, projectName: string): EmailTemplate => ({
    subject: `⚠️ Prazo Próximo - ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Prazo Próximo</h2>
        <p>A tarefa <strong>"${taskName}"</strong> no projeto <strong>"${projectName}"</strong> está próxima do prazo.</p>
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">Detalhes:</h3>
          <p style="margin: 4px 0;"><strong>Tarefa:</strong> ${taskName}</p>
          <p style="margin: 4px 0;"><strong>Projeto:</strong> ${projectName}</p>
          <p style="margin: 4px 0;"><strong>Data de Vencimento:</strong> ${endDate}</p>
        </div>
        <p>Por favor, verifique o progresso da tarefa e tome as ações necessárias.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Esta é uma notificação automática do sistema de gestão de projetos.
        </p>
      </div>
    `,
    text: `⚠️ Prazo Próximo\n\nA tarefa "${taskName}" no projeto "${projectName}" está próxima do prazo.\n\nDetalhes:\n- Tarefa: ${taskName}\n- Projeto: ${projectName}\n- Data de Vencimento: ${endDate}\n\nPor favor, verifique o progresso da tarefa e tome as ações necessárias.\n\nEsta é uma notificação automática do sistema de gestão de projetos.`
  }),

  deadlineUrgent: (taskName: string, endDate: string, projectName: string): EmailTemplate => ({
    subject: `🚨 Prazo Urgente - ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 Prazo Urgente</h2>
        <p>A tarefa <strong>"${taskName}"</strong> no projeto <strong>"${projectName}"</strong> vence amanhã!</p>
        <div style="background-color: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b;">Detalhes:</h3>
          <p style="margin: 4px 0;"><strong>Tarefa:</strong> ${taskName}</p>
          <p style="margin: 4px 0;"><strong>Projeto:</strong> ${projectName}</p>
          <p style="margin: 4px 0;"><strong>Data de Vencimento:</strong> ${endDate}</p>
        </div>
        <p><strong>Ação necessária:</strong> Complete a tarefa ou atualize o status no sistema.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Esta é uma notificação automática do sistema de gestão de projetos.
        </p>
      </div>
    `,
    text: `🚨 Prazo Urgente\n\nA tarefa "${taskName}" no projeto "${projectName}" vence amanhã!\n\nDetalhes:\n- Tarefa: ${taskName}\n- Projeto: ${projectName}\n- Data de Vencimento: ${endDate}\n\nAção necessária: Complete a tarefa ou atualize o status no sistema.\n\nEsta é uma notificação automática do sistema de gestão de projetos.`
  }),

  taskOverdue: (taskName: string, endDate: string, projectName: string): EmailTemplate => ({
    subject: `🔴 Tarefa Atrasada - ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🔴 Tarefa Atrasada</h2>
        <p>A tarefa <strong>"${taskName}"</strong> no projeto <strong>"${projectName}"</strong> está atrasada.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b;">Detalhes:</h3>
          <p style="margin: 4px 0;"><strong>Tarefa:</strong> ${taskName}</p>
          <p style="margin: 4px 0;"><strong>Projeto:</strong> ${projectName}</p>
          <p style="margin: 4px 0;"><strong>Data de Vencimento:</strong> ${endDate}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Atrasada</p>
        </div>
        <p><strong>Ação necessária:</strong> Atualize o status da tarefa no sistema o mais rápido possível.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Esta é uma notificação automática do sistema de gestão de projetos.
        </p>
      </div>
    `,
    text: `🔴 Tarefa Atrasada\n\nA tarefa "${taskName}" no projeto "${projectName}" está atrasada.\n\nDetalhes:\n- Tarefa: ${taskName}\n- Projeto: ${projectName}\n- Data de Vencimento: ${endDate}\n- Status: Atrasada\n\nAção necessária: Atualize o status da tarefa no sistema o mais rápido possível.\n\nEsta é uma notificação automática do sistema de gestão de projetos.`
  })
}

export { emailTemplates }
