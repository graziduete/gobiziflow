# 🔧 CONFIGURAÇÃO DO SUPABASE

## 📍 **ONDE ENCONTRAR AS CREDENCIAIS:**

### **1. Acesse o Supabase:**
- Vá para: https://supabase.com
- Faça login na sua conta
- Clique no seu projeto

### **2. Vá em Configurações:**
- No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem ⚙️)
- Depois clique em **"API"**

### **3. Copie as credenciais:**
Você verá uma tela com:

```
Project API keys
┌─────────────────────────────────────────────────────────────┐
│ Project URL                                                │
│ https://abcdefghijklmnop.supabase.co                      │
│                                                            │
│ anon public                                               │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                 │
└─────────────────────────────────────────────────────────────┘
```

### **4. Configure o arquivo .env.local:**

Edite o arquivo `.env.local` e substitua pelos valores reais:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA_REAL

# Email Configuration (opcional por enquanto)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

## 🚀 **DEPOIS DE CONFIGURAR:**

1. **Salve o arquivo .env.local**
2. **Reinicie o servidor** (Ctrl+C e depois `pnpm dev`)
3. **Teste o sistema** acessando: http://localhost:3002

## ❓ **PRECISA DE AJUDA?**

Se não conseguir encontrar essas informações, me envie um print da tela do Supabase que eu te ajudo! 