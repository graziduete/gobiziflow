-- Script 174: Multi-tenancy Financeiro - FASE 1: RECEITAS (APENAS)
-- Data: 2025-10-14
-- Descrição: Adiciona tenant_id APENAS na tabela revenue_entries para teste inicial
-- SEGURANÇA: Abordagem conservadora - 1 tabela por vez
-- ROLLBACK: Script 175 (se necessário)

-- =====================================================
-- IMPORTANTE: ESTE SCRIPT MODIFICA APENAS RECEITAS!
-- =====================================================
-- 
-- ✅ Tabela afetada: revenue_entries
-- ❌ Tabelas NÃO afetadas: expense_categories, expense_subcategories, expense_entries
-- 
-- LÓGICA DE ISOLAMENTO:
-- - Admin Master: vê APENAS tenant_id = NULL (Gobi)
-- - Admin Normal/Operacional: vê APENAS tenant_id = NULL (Gobi)
-- - Client Admin: vê APENAS tenant_id = [sua empresa]
-- 
-- =====================================================

-- =====================================================
-- BACKUP: Verificar dados ANTES da mudança
-- =====================================================

SELECT 
  'ANTES DA MUDANÇA' as momento,
  COUNT(*) as total_receitas,
  SUM(amount) as valor_total_bruto,
  SUM(net_amount) as valor_total_liquido
FROM revenue_entries;

-- =====================================================
-- PASSO 1: ADICIONAR COLUNA tenant_id (PERMITE NULL)
-- =====================================================

ALTER TABLE revenue_entries 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES companies(id);

-- =====================================================
-- PASSO 2: CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_revenue_entries_tenant_id 
ON revenue_entries(tenant_id);

-- =====================================================
-- PASSO 3: ADICIONAR COMENTÁRIO
-- =====================================================

COMMENT ON COLUMN revenue_entries.tenant_id IS 
'ID da empresa cliente (tenant) para isolamento multi-tenant.
NULL = Admin Master/Normal (aplicação principal Gobi)
UUID = Client Admin específico';

-- =====================================================
-- VERIFICAÇÃO 1: Confirmar que a coluna foi criada
-- =====================================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
  AND column_name = 'tenant_id';

-- =====================================================
-- VERIFICAÇÃO 2: Confirmar que TODOS os registros estão NULL
-- =====================================================

SELECT 
  'APÓS ADICIONAR COLUNA' as momento,
  COUNT(*) as total_receitas,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as receitas_tenant_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as receitas_com_tenant,
  SUM(amount) as valor_total_bruto,
  SUM(net_amount) as valor_total_liquido
FROM revenue_entries;

-- =====================================================
-- VERIFICAÇÃO 3: Confirmar que o índice foi criado
-- =====================================================

SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'revenue_entries' 
  AND indexname = 'idx_revenue_entries_tenant_id';

-- =====================================================
-- VERIFICAÇÃO 4: Conferir RLS atual (NÃO MODIFICAMOS AINDA)
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'revenue_entries';

-- =====================================================
-- STATUS APÓS EXECUÇÃO
-- =====================================================
-- 
-- ✅ Coluna tenant_id adicionada em revenue_entries
-- ✅ Índice criado para performance
-- ✅ TODOS os registros existentes têm tenant_id = NULL
-- ✅ Admin Master/Normal continuam vendo TODAS as receitas normalmente
-- ✅ RLS NÃO foi modificado (ainda usa a policy antiga)
-- 
-- ⚠️ PRÓXIMOS PASSOS (APENAS APÓS TESTAR):
-- 1. Modificar API /api/financeiro/revenues para filtrar por tenant_id
-- 2. Modificar Frontend /admin/financeiro/receitas para aplicar filtros
-- 3. Testar criação de receita como Client Admin
-- 4. Se tudo funcionar, avançar para FASE 2 (expense_categories)
-- 
-- 🔄 ROLLBACK (se necessário):
-- - Executar script 175_rollback_tenant_financeiro_receitas_fase1.sql
-- 
-- =====================================================

-- =====================================================
-- TESTE MANUAL SUGERIDO:
-- =====================================================
-- 
-- 1. Logar como Admin Master e verificar se as receitas aparecem normalmente
-- 2. Logar como Admin Normal e verificar se as receitas aparecem normalmente  
-- 3. Criar uma nova receita como Admin Normal (deve ter tenant_id = NULL)
-- 4. Logar como Client Admin e verificar que NÃO vê receitas antigas (esperado!)
-- 5. Criar uma nova receita como Client Admin (deve ter tenant_id preenchido)
-- 
-- =====================================================

