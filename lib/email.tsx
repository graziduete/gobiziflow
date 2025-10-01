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

// Client-side email sending function using API route
export async function sendEmailClient(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("❌ Erro ao enviar email via API:", error)
    return false
  }
}

export const emailTemplates = {
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

  passwordReset: ({ fullName, email, resetUrl }: { fullName: string; email: string; resetUrl: string }): EmailTemplate => ({
    subject: `🔐 Redefinição de Senha - GobiZi Flow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">🔐 Redefinição de Senha</h2>
        <p>Olá <strong>${fullName}</strong>!</p>
        <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Se você não solicitou esta redefinição, ignore este email.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Este link expira em 24 horas.
        </p>
      </div>
    `,
    text: `🔐 Redefinição de Senha\n\nOlá ${fullName}!\n\nVocê solicitou a redefinição de sua senha. Acesse o link abaixo para criar uma nova senha:\n\n${resetUrl}\n\nSe você não solicitou esta redefinição, ignore este email.\n\nEste link expira em 24 horas.`
  }),

  welcome: ({ fullName, email }: { fullName: string; email: string }): EmailTemplate => ({
    subject: `🎉 Bem-vindo ao GobiZi Flow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">🎉 Bem-vindo ao GobiZi Flow!</h2>
        <p>Olá <strong>${fullName}</strong>!</p>
        <p>Seja bem-vindo ao nosso sistema de gestão de projetos. Sua conta foi criada com sucesso!</p>
        <p>Você pode acessar o sistema usando o email: <strong>${email}</strong></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Esta é uma notificação automática do sistema.
        </p>
      </div>
    `,
    text: `🎉 Bem-vindo ao GobiZi Flow!\n\nOlá ${fullName}!\n\nSeja bem-vindo ao nosso sistema de gestão de projetos. Sua conta foi criada com sucesso!\n\nVocê pode acessar o sistema usando o email: ${email}\n\nEsta é uma notificação automática do sistema.`
  })
}
