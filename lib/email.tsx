// Email service utility functions
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

// Email templates
export const emailTemplates = {
  newUserCredentials: (data: { 
    fullName: string
    email: string
    password: string
    appUrl: string
    companyName?: string
  }) => ({
    subject: `🎉 Suas credenciais de acesso - ${data.companyName || 'Sistema de Projetos'}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Suas Credenciais de Acesso</title>
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
          .logo { 
            margin-bottom: 20px; 
          }
          .logo-text { 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .logo-flow { 
            font-size: 18px; 
            font-style: italic; 
            opacity: 0.9; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
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
          .credentials-box { 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
            border: 1px solid #e2e8f0; 
            border-radius: 16px; 
            padding: 30px; 
            margin: 25px 0; 
            text-align: center; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); 
          }
          .credential-item { 
            margin: 20px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
            transition: transform 0.2s ease; 
          }
          .credential-item:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
          }
          .credential-label { 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 8px; 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 8px; 
          }
          .credential-value { 
            font-size: 16px; 
            color: #111827; 
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; 
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
            padding: 12px 16px; 
            border-radius: 8px; 
            border: 1px solid #cbd5e1; 
            font-weight: 600; 
            letter-spacing: 0.5px; 
          }
          .warning { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 25px 0; 
            text-align: center; 
          }
          .warning-icon { 
            font-size: 24px; 
            margin-bottom: 10px; 
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
          .cta-button:hover { 
            transform: translateY(-2px); 
          }
          .footer { 
            background-color: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
          }
          .company-info { 
            margin-bottom: 20px; 
            padding: 15px; 
            background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%); 
            border: 1px solid #3b82f6; 
            border-radius: 8px; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            
            <h1>🎉 Bem-vindo ao GobiZi Flow!</h1>
            <p>Sua conta foi criada com sucesso</p>
          </div>
          
          <div class="content">
            <div class="welcome">
              Olá <strong>${data.fullName}</strong>! 👋
            </div>
            
            ${data.companyName ? `
            <div class="company-info">
              <strong>🏢 Empresa:</strong> ${data.companyName}
            </div>
            ` : ''}
            
            <div class="credentials-box">
              <h3 style="margin: 0 0 20px 0; color: #374151;">🔑 Suas Credenciais de Acesso</h3>
              
              <div class="credential-item">
                <div class="credential-label">📧 E-mail</div>
                <div class="credential-value">${data.email}</div>
              </div>
              
              <div class="credential-item">
                <div class="credential-label">🔐 Senha Temporária</div>
                <div class="credential-value">${data.password}</div>
              </div>
            </div>
            
            <div class="warning">
              <div class="warning-icon">⚠️</div>
              <strong>Importante:</strong> Por segurança, você será obrigado a alterar sua senha no primeiro acesso.
            </div>
            
            <div style="text-align: center;">
              <a href="https://flow.gobi-zi.com/auth/login" class="cta-button">
                🚀 Acessar o Sistema
              </a>
              <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                <strong>flow.gobi-zi.com</strong>
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">📋 Como acessar:</h4>
              <ol style="text-align: left; margin: 0; padding-left: 20px; color: #6b7280;">
                <li>Acesse o sistema usando o botão acima</li>
                <li>Insira seu e-mail e a senha temporária</li>
                <li>Você será redirecionado para redefinir sua senha</li>
                <li>Escolha uma nova senha segura</li>
                <li>Pronto! Você já pode usar o sistema</li>
              </ol>
            </div>
          </div>
          
          <div class="footer">
            <p>Se você não solicitou esta conta, ignore este e-mail.</p>
            <p>© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `GobiZi Flow - Bem-vindo ao Sistema!

Olá ${data.fullName}! 👋

${data.companyName ? `🏢 Empresa: ${data.companyName}\n\n` : ''}🔑 Suas Credenciais de Acesso:

E-mail: ${data.email}
Senha Temporária: ${data.password}

⚠️ Importante: Por segurança, você será obrigado a alterar sua senha no primeiro acesso.

🚀 Acesse o sistema: https://flow.gobi-zi.com/auth/login

📋 Como acessar:
1. Acesse o sistema usando o link acima
2. Insira seu e-mail e a senha temporária
3. Você será redirecionado para redefinir sua senha
4. Escolha uma nova senha segura
5. Pronto! Você já pode usar o sistema

Se você não solicitou esta conta, ignore este e-mail.

© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.`,
  }),

  taskAssigned: (data: { taskTitle: string; projectName: string; dueDate?: string; assignedBy: string }) => ({
    subject: `Nova tarefa atribuída: ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nova Tarefa Atribuída</h2>
        <p>Olá,</p>
        <p>Uma nova tarefa foi atribuída a você:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${data.taskTitle}</h3>
          <p style="margin: 5px 0;"><strong>Projeto:</strong> ${data.projectName}</p>
          ${data.dueDate ? `<p style="margin: 5px 0;"><strong>Prazo:</strong> ${new Date(data.dueDate).toLocaleDateString("pt-BR")}</p>` : ""}
          <p style="margin: 5px 0;"><strong>Atribuído por:</strong> ${data.assignedBy}</p>
        </div>
        <p>Acesse o sistema para mais detalhes.</p>
        <p>Atenciosamente,<br>Equipe de Projetos</p>
      </div>
    `,
    text: `Nova Tarefa Atribuída\n\nOlá,\n\nUma nova tarefa foi atribuída a você:\n\nTarefa: ${data.taskTitle}\nProjeto: ${data.projectName}\n${data.dueDate ? `Prazo: ${new Date(data.dueDate).toLocaleDateString("pt-BR")}\n` : ""}Atribuído por: ${data.assignedBy}\n\nAcesse o sistema para mais detalhes.\n\nAtenciosamente,\nEquipe de Projetos`,
  }),

  projectCreated: (data: { projectName: string; companyName: string; createdBy: string }) => ({
    subject: `Novo projeto criado: ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Novo Projeto Criado</h2>
        <p>Olá,</p>
        <p>Um novo projeto foi criado para sua empresa:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${data.projectName}</h3>
          <p style="margin: 5px 0;"><strong>Empresa:</strong> ${data.companyName}</p>
          <p style="margin: 5px 0;"><strong>Criado por:</strong> ${data.createdBy}</p>
        </div>
        <p>Acesse o sistema para acompanhar o progresso.</p>
        <p>Atenciosamente,<br>Equipe de Projetos</p>
      </div>
    `,
    text: `Novo Projeto Criado\n\nOlá,\n\nUm novo projeto foi criado para sua empresa:\n\nProjeto: ${data.projectName}\nEmpresa: ${data.companyName}\nCriado por: ${data.createdBy}\n\nAcesse o sistema para acompanhar o progresso.\n\nAtenciosamente,\nEquipe de Projetos`,
  }),

  taskDueReminder: (data: { taskTitle: string; projectName: string; dueDate: string }) => ({
    subject: `Lembrete: Tarefa vence em breve - ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Lembrete de Prazo</h2>
        <p>Olá,</p>
        <p>Esta é uma lembrança de que uma tarefa vence em breve:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${data.taskTitle}</h3>
          <p style="margin: 5px 0;"><strong>Projeto:</strong> ${data.projectName}</p>
          <p style="margin: 5px 0;"><strong>Prazo:</strong> ${new Date(data.dueDate).toLocaleDateString("pt-BR")}</p>
        </div>
        <p>Não se esqueça de concluir esta tarefa no prazo.</p>
        <p>Atenciosamente,<br>Equipe de Projetos</p>
      </div>
    `,
    text: `Lembrete de Prazo\n\nOlá,\n\nEsta é uma lembrança de que uma tarefa vence em breve:\n\nTarefa: ${data.taskTitle}\nProjeto: ${data.projectName}\nPrazo: ${new Date(data.dueDate).toLocaleDateString("pt-BR")}\n\nNão se esqueça de concluir esta tarefa no prazo.\n\nAtenciosamente,\nEquipe de Projetos`,
  }),

  statusChanged: (data: {
    itemType: "project" | "task"
    itemName: string
    oldStatus: string
    newStatus: string
    changedBy: string
  }) => ({
    subject: `Status atualizado: ${data.itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Status Atualizado</h2>
        <p>Olá,</p>
        <p>O status de ${data.itemType === "project" ? "um projeto" : "uma tarefa"} foi atualizado:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${data.itemName}</h3>
          <p style="margin: 5px 0;"><strong>Status anterior:</strong> ${data.oldStatus}</p>
          <p style="margin: 5px 0;"><strong>Novo status:</strong> ${data.newStatus}</p>
          <p style="margin: 5px 0;"><strong>Alterado por:</strong> ${data.changedBy}</p>
        </div>
        <p>Acesse o sistema para mais detalhes.</p>
        <p>Atenciosamente,<br>Equipe de Projetos</p>
      </div>
    `,
    text: `Status Atualizado\n\nOlá,\n\nO status de ${data.itemType === "project" ? "um projeto" : "uma tarefa"} foi atualizado:\n\n${data.itemName}\nStatus anterior: ${data.oldStatus}\nNovo status: ${data.newStatus}\nAlterado por: ${data.changedBy}\n\nAcesse o sistema para mais detalhes.\n\nAtenciosamente,\nEquipe de Projetos`,
  }),

  passwordReset: (data: { 
    fullName: string
    email: string
    resetUrl: string
  }) => ({
    subject: `🔐 Redefinir sua senha - GobiZi Flow`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha</title>
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
          .logo { 
            margin-bottom: 20px; 
          }
          .logo-text { 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .logo-flow { 
            font-size: 18px; 
            font-style: italic; 
            opacity: 0.9; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
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
          .reset-box { 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
            border: 1px solid #e2e8f0; 
            border-radius: 16px; 
            padding: 30px; 
            margin: 25px 0; 
            text-align: center; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); 
          }
          .reset-info { 
            margin: 20px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
          }
          .reset-label { 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 8px; 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 8px; 
          }
          .reset-value { 
            font-size: 16px; 
            color: #111827; 
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; 
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
            padding: 12px 16px; 
            border-radius: 8px; 
            border: 1px solid #cbd5e1; 
            font-weight: 600; 
            letter-spacing: 0.5px; 
          }
          .warning { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 25px 0; 
            text-align: center; 
          }
          .warning-icon { 
            font-size: 24px; 
            margin-bottom: 10px; 
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
          .cta-button:hover { 
            transform: translateY(-2px); 
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
            <div class="logo">
              <div class="logo-text">GobiZi</div>
              <div class="logo-flow">Flow</div>
            </div>
            <h1>🔐 Redefinir Senha</h1>
            <p>Solicitação de redefinição de senha</p>
          </div>
          
          <div class="content">
            <div class="welcome">
              Olá <strong>${data.fullName}</strong>! 👋
            </div>
            
            <div class="reset-box">
              <h3 style="margin: 0 0 20px 0; color: #374151;">🔑 Redefinir sua Senha</h3>
              
              <div class="reset-info">
                <div class="reset-label">📧 Email da Conta</div>
                <div class="reset-value">${data.email}</div>
              </div>
            </div>
            
            <div class="warning">
              <div class="warning-icon">⚠️</div>
              <strong>Importante:</strong> Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.
            </div>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="cta-button">
                🔐 Redefinir Senha
              </a>
              <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                <strong>flow.gobi-zi.com</strong>
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 15px 0; color: #374151;">📋 Como redefinir:</h4>
              <ol style="text-align: left; margin: 0; padding-left: 20px; color: #6b7280;">
                <li>Clique no botão "Redefinir Senha" acima</li>
                <li>Digite sua nova senha</li>
                <li>Confirme a nova senha</li>
                <li>Clique em "Atualizar Senha"</li>
                <li>Pronto! Sua senha foi redefinida</li>
              </ol>
            </div>
          </div>
          
          <div class="footer">
            <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
            <p>© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `GobiZi Flow - Redefinir Senha

Olá ${data.fullName}! 👋

🔑 Redefinir sua Senha

📧 Email da Conta: ${data.email}

⚠️ Importante: Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.

🔐 Redefinir Senha: ${data.resetUrl}

📋 Como redefinir:
1. Clique no link "Redefinir Senha" acima
2. Digite sua nova senha
3. Confirme a nova senha
4. Clique em "Atualizar Senha"
5. Pronto! Sua senha foi redefinida

Se você não solicitou esta redefinição, ignore este e-mail.

© ${new Date().getFullYear()} GobiZi Flow. Todos os direitos reservados.`,
  }),
}

// Client-side email sending function using API route
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Falha ao enviar email")
    }

    const result = await response.json()
    console.log("📧 Email enviado com sucesso:", result)
    return true
  } catch (error) {
    console.error("❌ Falha ao enviar email:", error)
    return false
  }
}

// Notification preferences
export interface NotificationPreferences {
  taskAssigned: boolean
  projectCreated: boolean
  taskDueReminder: boolean
  statusChanged: boolean
  emailEnabled: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  taskAssigned: true,
  projectCreated: true,
  taskDueReminder: true,
  statusChanged: true,
  emailEnabled: true,
}
