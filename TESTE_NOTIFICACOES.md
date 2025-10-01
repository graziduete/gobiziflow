# 🧪 GUIA DE TESTE - SISTEMA DE NOTIFICAÇÕES

## 📋 PRÉ-REQUISITOS

Antes de testar, certifique-se de que:
1. O servidor está rodando (`npm run dev`)
2. Você está logado como admin
3. O projeto tem um responsável cadastrado

---

## 🎯 CENÁRIOS DE TESTE

### **CENÁRIO 1: Alerta de 3 dias (Aviso)**
**Objetivo:** Testar notificação de prazo próximo

**Passos:**
1. Vá para o projeto FTD Marista
2. Edite a tarefa "Revisar Proposta Comercial"
3. **Altere a data de fim para: 03/10/2025** (3 dias no futuro)
4. **Certifique-se de que o status é: "Não Iniciado" ou "Em Andamento"**
5. Salve o projeto
6. Execute no terminal: `./test-deadline.sh`

**Resultado esperado:**
- ✅ Notificação no sino: "⏰ Tarefas sob sua responsabilidade vencem em breve"
- ✅ Email recebido com o mesmo título
- ✅ Data no sino e email: 03/10/2025

---

### **CENÁRIO 2: Alerta urgente (1 dia)**
**Objetivo:** Testar notificação de prazo urgente

**Passos:**
1. Vá para o projeto FTD Marista
2. Edite a tarefa "Revisar Proposta Comercial"
3. **Altere a data de fim para: 01/10/2025** (amanhã)
4. **Certifique-se de que o status é: "Não Iniciado" ou "Em Andamento"**
5. Salve o projeto
6. Execute no terminal: `./test-deadline.sh`

**Resultado esperado:**
- ✅ Notificação no sino: "🚨 Tarefas sob sua responsabilidade vencem amanhã"
- ✅ Email recebido com o mesmo título
- ✅ Data no sino e email: 01/10/2025

---

### **CENÁRIO 3: Tarefa atrasada**
**Objetivo:** Testar mudança automática de status e notificação

**Passos:**
1. Vá para o projeto FTD Marista
2. Edite a tarefa "Revisar Proposta Comercial"
3. **Altere a data de fim para: 29/09/2025** (ontem)
4. **IMPORTANTE: Altere o status para: "Em Andamento"** (não "Atrasada")
5. Salve o projeto
6. Execute no terminal: `./test-deadline.sh`

**Resultado esperado:**
- ✅ Notificação no sino: "❌ Tarefa Atrasada"
- ✅ Email recebido com o mesmo título
- ✅ **Status da tarefa muda automaticamente para "Atrasada"**
- ✅ Data no sino e email: 29/09/2025

---

## ⚠️ PROBLEMAS COMUNS

### **"Não recebi notificação"**

**Causa 1:** Status da tarefa não é "Em Andamento" ou "Não Iniciado"
- **Solução:** Verifique se o status é `in_progress` ou `not_started`

**Causa 2:** Notificação já foi enviada nas últimas 2 horas
- **Solução:** O sistema evita duplicação. Aguarde 2 horas ou mude os dados da tarefa

**Causa 3:** Responsável não está cadastrado
- **Solução:** Verifique se o responsável está em `/admin/responsaveis`

**Causa 4:** Data calculada incorretamente
- **Solução:** Use datas claras (03/10/2025 para 3 dias, 01/10/2025 para 1 dia)

---

## 🔄 LIMPAR NOTIFICAÇÕES PARA NOVO TESTE

Se você quer testar novamente a mesma tarefa:

1. Execute o script SQL: `scripts/069_clean_duplicate_notifications.sql`
2. Ou aguarde 2 horas entre os testes
3. Ou mude ligeiramente o título/responsável da tarefa

---

## 🚀 CONFIGURAR CRON JOB EM PRODUÇÃO

Para automatizar em produção (não precisa executar manualmente):

### **Opção 1: Vercel Cron (Recomendado)**
Adicione no `vercel.json`:
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
Executará todos os dias às 9h.

### **Opção 2: Serviço externo (cron-job.org)**
1. Acesse https://cron-job.org
2. Crie um job apontando para: `https://seu-dominio.com/api/cron/deadline-monitor`
3. Configure para executar diariamente

---

## 📊 VERIFICAR LOGS

Após executar o teste, você pode verificar:

1. **Logs no terminal** - Ver processamento em tempo real
2. **Sino de notificações** - Canto superior direito
3. **Email** - Verifique sua caixa de entrada
4. **Logs no sistema** - `/admin/notifications/logs`
5. **Status da tarefa** - Deve mudar para "Atrasada" se vencida

---

## ✅ CHECKLIST DE TESTE

- [ ] Data de fim configurada corretamente
- [ ] Status da tarefa é "Em Andamento"
- [ ] Responsável está cadastrado
- [ ] Servidor está rodando
- [ ] Executou `./test-deadline.sh`
- [ ] Verificou o sino
- [ ] Verificou o email
- [ ] Verificou os logs

---

## 🆘 AINDA COM PROBLEMAS?

Se ainda assim não funcionar, verifique:
1. Console do navegador (F12) - Erros de JavaScript
2. Terminal do servidor - Erros de API
3. Tabela `responsaveis` - Se o responsável existe
4. Tabela `tasks` - Se a tarefa tem os dados corretos
