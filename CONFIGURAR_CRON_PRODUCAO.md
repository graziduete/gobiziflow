# ⚙️ CONFIGURAR CRON JOB EM PRODUÇÃO

## 🎯 O QUE É O CRON JOB?

O cron job é um **agendador automático** que executará o monitoramento de prazos **todo dia automaticamente**, sem você precisar fazer nada.

---

## 🚀 OPÇÃO 1: VERCEL CRON (Recomendada)

### **Se você hospeda no Vercel (flow.gobi-zi.com):**

#### **Passo 1: Adicionar arquivo `vercel.json`**
Já criei o arquivo `vercel.json` na raiz do projeto com:

```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-monitor",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**O que isso significa:**
- `0 9 * * *` = Todo dia às **9h da manhã** (horário UTC)
- Para horário de Brasília (UTC-3), ajuste para `0 12 * * *` (meio-dia UTC = 9h Brasília)

#### **Passo 2: Fazer commit e push**
```bash
git add vercel.json
git commit -m "feat: Adicionar cron job para monitoramento de prazos"
git push origin main
```

#### **Passo 3: Verificar no Vercel Dashboard**
1. Acesse https://vercel.com/dashboard
2. Entre no seu projeto
3. Vá em **Settings** > **Cron Jobs**
4. Você verá o cron configurado

✅ **PRONTO!** O sistema vai rodar automaticamente todo dia às 9h.

---

## 🌐 OPÇÃO 2: CRON-JOB.ORG (Serviço Externo)

### **Se você NÃO usa Vercel ou quer mais controle:**

#### **Passo 1: Criar conta**
1. Acesse: https://cron-job.org
2. Crie uma conta gratuita

#### **Passo 2: Criar novo cron job**
1. Clique em "Create cronjob"
2. Preencha:
   - **Title:** Monitoramento de Prazos - GobiZi Flow
   - **URL:** `https://flow.gobi-zi.com/api/cron/deadline-monitor`
   - **Schedule:** `Every day at 09:00`
   - **Method:** POST
3. Salve

✅ **PRONTO!** O serviço vai chamar sua API todo dia às 9h.

---

## 🔐 SEGURANÇA (IMPORTANTE!)

Atualmente, o endpoint `/api/cron/deadline-monitor` está **sem autenticação** (para facilitar testes).

### **Para produção, você DEVE adicionar segurança:**

#### **Opção A: Vercel Cron (mais seguro)**
- Apenas cron jobs autorizados pela Vercel podem chamar
- Já vem com proteção automática

#### **Opção B: Token secreto**
Adicione um token secreto no código:

```typescript
// No arquivo: app/api/cron/deadline-monitor/route.ts

export async function POST(request: Request) {
  // Verificar token de segurança
  const authHeader = request.headers.get('authorization')
  const token = process.env.CRON_SECRET_TOKEN
  
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }
  
  // ... resto do código
}
```

E configure a variável de ambiente:
- No Vercel: Settings > Environment Variables
- Adicione: `CRON_SECRET_TOKEN` = um token aleatório forte

---

## ⏰ PERSONALIZANDO O HORÁRIO

### **Formato Cron:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Dia da semana (0-7, 0 e 7 = Domingo)
│ │ │ └───── Mês (1-12)
│ │ └─────── Dia do mês (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

### **Exemplos:**

| Horário Desejado | Cron Expression | Descrição |
|------------------|-----------------|-----------|
| Todo dia 9h | `0 9 * * *` | 9h da manhã |
| Todo dia 12h | `0 12 * * *` | Meio-dia |
| Todo dia 9h e 17h | `0 9,17 * * *` | 9h e 17h |
| A cada 6 horas | `0 */6 * * *` | 00h, 06h, 12h, 18h |
| Segunda a Sexta 9h | `0 9 * * 1-5` | Dias úteis às 9h |

### **Para ajustar no Vercel:**
Edite o `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-monitor",
      "schedule": "0 12 * * *"  // <- Altere aqui
    }
  ]
}
```

---

## 🧪 TESTAR EM PRODUÇÃO

Depois de configurar, você pode testar manualmente:

### **Vercel:**
```bash
curl -X POST https://flow.gobi-zi.com/api/cron/deadline-monitor
```

### **Com token de segurança:**
```bash
curl -X POST https://flow.gobi-zi.com/api/cron/deadline-monitor \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 MONITORAR EXECUÇÕES

### **Vercel:**
- Dashboard > Logs
- Você verá cada execução do cron

### **Cron-job.org:**
- Dashboard > Executions
- Histórico de todas as execuções

### **No seu sistema:**
- Acesse `/admin/notifications/logs`
- Veja todas as notificações enviadas

---

## ✅ CHECKLIST DE PRODUÇÃO

- [ ] Arquivo `vercel.json` criado
- [ ] Horário configurado corretamente
- [ ] Commit e push feitos
- [ ] Verificado no Vercel Dashboard
- [ ] Testado manualmente em produção
- [ ] (Opcional) Token de segurança configurado
- [ ] Monitoramento funcionando

---

## 🆘 PROBLEMAS COMUNS

### **"Cron não está executando"**
1. Verifique se o `vercel.json` está na raiz do projeto
2. Verifique se fez commit e push
3. Verifique no Vercel Dashboard se o cron aparece

### **"Endpoint retorna 401"**
- Você adicionou token de segurança mas o Vercel não tem acesso
- Configure a variável de ambiente `CRON_SECRET_TOKEN`

### **"Notificações não estão sendo enviadas"**
1. Verifique os logs no Vercel
2. Verifique `/admin/notifications/logs`
3. Execute manualmente para ver o erro

---

## 📝 RESUMO

**Em Desenvolvimento:**
- Execute manualmente: `./test-deadline.sh`

**Em Produção:**
- Configure o `vercel.json` (já feito ✅)
- Faça commit e push
- O sistema roda **automaticamente** todo dia às 9h

**Horário recomendado:** 9h da manhã (início do expediente)
