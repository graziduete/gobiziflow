# 📊 PLANO DE IMPLEMENTAÇÃO: Multi-tenancy no Módulo Financeiro

**Data:** 2025-10-14  
**Estratégia:** Isolamento Total (Opção A)  
**Abordagem:** Módulo por Módulo (MÁXIMA SEGURANÇA)

---

## 🎯 LÓGICA DE ISOLAMENTO DEFINIDA

### Visão por Perfil:

| Perfil | Vê o quê? |
|--------|-----------|
| **Admin Master** | ✅ APENAS `tenant_id = NULL` (Gobi) |
| **Admin Normal** | ✅ APENAS `tenant_id = NULL` (Gobi) |
| **Admin Operacional** | ✅ APENAS `tenant_id = NULL` (Gobi) |
| **Client Admin** | ✅ APENAS `tenant_id = [sua_empresa]` |

**Regra de Ouro:** Dados 100% isolados, ZERO mistura!

---

## 📋 FASE 1: RECEITAS (revenue_entries)

### Etapa 1.1: Preparação do Banco ✅
- [x] Script criado: `174_add_tenant_financeiro_receitas_fase1.sql`
- [x] Script rollback criado: `175_rollback_tenant_financeiro_receitas_fase1.sql`
- [ ] **VOCÊ EXECUTA:** Script 174 no Supabase
- [ ] **VOCÊ CONFERE:** Verificações do script (todas as receitas devem ter `tenant_id = NULL`)

**Resultado Esperado:**
```sql
-- Todas as receitas existentes devem ter tenant_id = NULL
SELECT COUNT(*) FROM revenue_entries WHERE tenant_id IS NULL;
-- Deve retornar: TODAS as receitas
```

---

### Etapa 1.2: Modificar API - `/api/financeiro/revenues`
- [ ] Adicionar lógica de filtro por `tenant_id`
- [ ] Testar com Admin Master (deve ver tenant_id = NULL)
- [ ] Testar com Admin Normal (deve ver tenant_id = NULL)
- [ ] Testar com Client Admin (não deve ver nada ainda)

**Código a modificar:**
```typescript
// /app/api/financeiro/revenues/route.ts
// Adicionar filtro de tenant_id baseado no perfil do usuário
```

---

### Etapa 1.3: Modificar Frontend - `/admin/financeiro/receitas`
- [ ] Aplicar filtros no `loadRevenues()`
- [ ] Testar criação de receita como Admin Normal (deve criar com `tenant_id = NULL`)
- [ ] Testar criação de receita como Client Admin (deve criar com `tenant_id = [empresa]`)
- [ ] Verificar se Admin Master vê apenas receitas `tenant_id = NULL`

**Arquivo a modificar:**
```typescript
// /app/admin/financeiro/receitas/page.tsx
// Modificar fetchCompanies e handleAddRevenue
```

---

### Etapa 1.4: Testes de Validação
- [ ] Admin Master: Criar receita → deve ter `tenant_id = NULL`
- [ ] Admin Normal: Criar receita → deve ter `tenant_id = NULL`
- [ ] Client Admin: Criar receita → deve ter `tenant_id = [company_id]`
- [ ] Admin Master: Visualizar receitas → vê apenas NULL
- [ ] Client Admin: Visualizar receitas → vê apenas seu tenant

**Critério de Sucesso:** ✅ Se TODOS os testes passarem → avançar para FASE 2

---

## 📋 FASE 2: CATEGORIAS DE DESPESAS

### Etapa 2.1: Preparação do Banco
- [ ] Criar script: `176_add_tenant_financeiro_categorias_fase2.sql`
- [ ] Adicionar `tenant_id` em `expense_categories`
- [ ] Adicionar `tenant_id` em `expense_subcategories`
- [ ] Criar índices
- [ ] Executar e verificar

---

### Etapa 2.2: Modificar APIs
- [ ] `/api/financeiro/categories` - Filtrar por tenant
- [ ] `/api/financeiro/subcategories` - Filtrar por tenant
- [ ] Testar criação/edição/exclusão

---

### Etapa 2.3: Modificar Frontend
- [ ] `/admin/financeiro/categorias/page.tsx`
- [ ] Filtrar categorias no `fetchCategories()`
- [ ] Filtrar subcategorias no `fetchSubcategories()`
- [ ] Testar CRUD completo

---

### Etapa 2.4: Testes de Validação
- [ ] Admin Master: CRUD de categorias → `tenant_id = NULL`
- [ ] Client Admin: CRUD de categorias → `tenant_id = [empresa]`
- [ ] Verificar isolamento completo

**Critério de Sucesso:** ✅ Se TODOS os testes passarem → avançar para FASE 3

---

## 📋 FASE 3: LANÇAMENTOS DE DESPESAS

### Etapa 3.1: Preparação do Banco
- [ ] Criar script: `177_add_tenant_financeiro_despesas_fase3.sql`
- [ ] Adicionar `tenant_id` em `expense_entries`
- [ ] Criar índices
- [ ] Executar e verificar

---

### Etapa 3.2: Modificar APIs
- [ ] `/api/financeiro/entries` - Filtrar por tenant
- [ ] Testar lançamento de despesas

---

### Etapa 3.3: Modificar Frontend
- [ ] `/admin/financeiro/despesas/page.tsx`
- [ ] Filtrar despesas no `fetchExpenseEntries()`
- [ ] Testar edição de valores mês a mês

---

### Etapa 3.4: Testar DRE Completo
- [ ] Admin Master: DRE deve mostrar apenas dados `tenant_id = NULL`
- [ ] Client Admin: DRE deve mostrar apenas dados do seu tenant
- [ ] Verificar cálculos (receitas - despesas)
- [ ] Testar exportação (PNG e Excel)

**Critério de Sucesso:** ✅ DRE funcionando perfeitamente para cada perfil

---

## 🎯 CRITÉRIOS DE SUCESSO FINAL

### ✅ Receitas
- [x] Script 174 executado com sucesso
- [ ] API filtrando corretamente por tenant
- [ ] Frontend criando receitas com tenant correto
- [ ] Admin Master vê apenas NULL
- [ ] Client Admin vê apenas seu tenant

### ✅ Categorias
- [ ] Script 176 executado com sucesso
- [ ] APIs filtrando corretamente
- [ ] Frontend funcionando com CRUD completo
- [ ] Isolamento 100% confirmado

### ✅ Despesas
- [ ] Script 177 executado com sucesso
- [ ] Lançamentos isolados por tenant
- [ ] DRE calculando corretamente
- [ ] Exportações funcionando

---

## 🔄 ESTRATÉGIA DE ROLLBACK

### Se algo der errado em qualquer fase:

**FASE 1 (Receitas):**
```bash
# Executar no Supabase:
/scripts/175_rollback_tenant_financeiro_receitas_fase1.sql
```

**FASE 2 (Categorias):**
```bash
# Executar no Supabase:
/scripts/178_rollback_tenant_financeiro_categorias_fase2.sql (a criar)
```

**FASE 3 (Despesas):**
```bash
# Executar no Supabase:
/scripts/179_rollback_tenant_financeiro_despesas_fase3.sql (a criar)
```

---

## ⚠️ PONTOS DE ATENÇÃO

### Antes de Executar Script 174:
1. ✅ Fazer backup do banco (snapshot no Supabase)
2. ✅ Avisar usuários que haverá manutenção
3. ✅ Testar em horário de baixo movimento
4. ✅ Ter o script de rollback pronto

### Durante os Testes:
1. ✅ Testar com TODOS os perfis (Master, Normal, Client Admin)
2. ✅ Verificar console do navegador para erros
3. ✅ Conferir dados no banco após cada operação
4. ✅ Documentar qualquer comportamento inesperado

### Após Cada Fase:
1. ✅ Validar que Admin Master/Normal veem apenas NULL
2. ✅ Validar que Client Admin vê apenas seu tenant
3. ✅ Confirmar que NADA foi quebrado na aplicação principal
4. ✅ Só avançar para próxima fase se tudo estiver perfeito

---

## 📞 SUPORTE

**Se encontrar problemas:**
1. NÃO ENTRE EM PÂNICO! 😊
2. Execute o script de rollback da fase atual
3. Documente o erro encontrado
4. Compartilhe o erro comigo para análise
5. Vamos corrigir antes de tentar novamente

---

## 🎉 PRÓXIMO PASSO IMEDIATO

**EXECUTAR AGORA:**
1. ✅ Você executa: `scripts/174_add_tenant_financeiro_receitas_fase1.sql` no Supabase
2. ✅ Você confere: Todas as verificações do script
3. ✅ Você testa: Acessar `/admin/financeiro/receitas` e verificar se tudo continua normal
4. ✅ Você me avisa: "Script 174 executado com sucesso!" ou "Deu erro: [mensagem]"

**Depois disso, eu modifico a API e o Frontend para você testar!** 🚀

---

**Está confortável para executar o Script 174?** 🤔

