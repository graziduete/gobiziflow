-- Script 175: ROLLBACK - Multi-tenancy Financeiro - FASE 1: RECEITAS
-- Data: 2025-10-14
-- Descrição: Reverte as mudanças do script 174 (remove tenant_id de revenue_entries)
-- SEGURANÇA: Rollback completo e seguro

-- =====================================================
-- IMPORTANTE: ESTE SCRIPT REVERTE APENAS AS MUDANÇAS EM RECEITAS!
-- =====================================================

-- =====================================================
-- BACKUP: Verificar dados ANTES do rollback
-- =====================================================

SELECT 
  'ANTES DO ROLLBACK' as momento,
  COUNT(*) as total_receitas,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as receitas_tenant_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as receitas_com_tenant,
  SUM(amount) as valor_total_bruto,
  SUM(net_amount) as valor_total_liquido
FROM revenue_entries;

-- =====================================================
-- AVISO: Receitas com tenant_id preenchido
-- =====================================================

SELECT 
  '⚠️ ATENÇÃO: As seguintes receitas TÊM tenant_id preenchido:' as aviso,
  id,
  client,
  amount,
  tenant_id,
  created_at
FROM revenue_entries
WHERE tenant_id IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- PASSO 1: REMOVER ÍNDICE
-- =====================================================

DROP INDEX IF EXISTS idx_revenue_entries_tenant_id;

-- =====================================================
-- PASSO 2: REMOVER COLUNA tenant_id
-- =====================================================

ALTER TABLE revenue_entries 
DROP COLUMN IF EXISTS tenant_id;

-- =====================================================
-- VERIFICAÇÃO 1: Confirmar que a coluna foi removida
-- =====================================================

SELECT 
  COUNT(*) as coluna_existe
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
  AND column_name = 'tenant_id';
-- Deve retornar 0 (zero)

-- =====================================================
-- VERIFICAÇÃO 2: Confirmar estrutura da tabela
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAÇÃO 3: Confirmar que o índice foi removido
-- =====================================================

SELECT 
  COUNT(*) as indice_existe
FROM pg_indexes 
WHERE tablename = 'revenue_entries' 
  AND indexname = 'idx_revenue_entries_tenant_id';
-- Deve retornar 0 (zero)

-- =====================================================
-- VERIFICAÇÃO 4: Confirmar dados preservados
-- =====================================================

SELECT 
  'APÓS ROLLBACK' as momento,
  COUNT(*) as total_receitas,
  SUM(amount) as valor_total_bruto,
  SUM(net_amount) as valor_total_liquido
FROM revenue_entries;

-- =====================================================
-- STATUS APÓS ROLLBACK
-- =====================================================
-- 
-- ✅ Coluna tenant_id removida de revenue_entries
-- ✅ Índice removido
-- ✅ TODOS os dados preservados
-- ✅ Tabela volta ao estado original
-- ✅ Admin Master/Normal continuam vendo TODAS as receitas
-- 
-- ⚠️ IMPORTANTE:
-- - Se havia receitas com tenant_id preenchido, elas foram perdidas
-- - Verifique o SELECT acima para ver quais receitas tinham tenant_id
-- 
-- 📝 PRÓXIMOS PASSOS:
-- - Investigar por que o rollback foi necessário
-- - Corrigir o problema identificado
-- - Re-executar script 174 quando estiver pronto
-- 
-- =====================================================

