-- Script 174: Adicionar tenant_id ao módulo Financeiro - FASE 1 (Preparação)
-- Data: 2025-10-14
-- Descrição: Adiciona coluna tenant_id nas tabelas financeiras SEM quebrar nada
-- SEGURANÇA: Todos os registros existentes ficam com tenant_id = NULL (Admin Normal continua vendo tudo)

-- =====================================================
-- FASE 1: ADICIONAR COLUNA tenant_id (PERMITE NULL)
-- =====================================================

-- 1. Receitas
ALTER TABLE revenue_entries 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES companies(id);

-- 2. Categorias de Despesas
ALTER TABLE expense_categories 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES companies(id);

-- 3. Subcategorias de Despesas
ALTER TABLE expense_subcategories 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES companies(id);

-- 4. Lançamentos de Despesas
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES companies(id);

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_revenue_entries_tenant_id 
ON revenue_entries(tenant_id);

CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant_id 
ON expense_categories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_expense_subcategories_tenant_id 
ON expense_subcategories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_expense_entries_tenant_id 
ON expense_entries(tenant_id);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN revenue_entries.tenant_id IS 
'ID da empresa cliente (tenant) - NULL para admin principal (Admin Normal/Operacional), preenchido para Client Admin';

COMMENT ON COLUMN expense_categories.tenant_id IS 
'ID da empresa cliente (tenant) - NULL para admin principal (Admin Normal/Operacional), preenchido para Client Admin';

COMMENT ON COLUMN expense_subcategories.tenant_id IS 
'ID da empresa cliente (tenant) - NULL para admin principal (Admin Normal/Operacional), preenchido para Client Admin';

COMMENT ON COLUMN expense_entries.tenant_id IS 
'ID da empresa cliente (tenant) - NULL para admin principal (Admin Normal/Operacional), preenchido para Client Admin';

-- =====================================================
-- VERIFICAÇÃO: Conferir se as colunas foram criadas
-- =====================================================

SELECT 
  'revenue_entries' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
  AND column_name = 'tenant_id'

UNION ALL

SELECT 
  'expense_categories' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'expense_categories' 
  AND column_name = 'tenant_id'

UNION ALL

SELECT 
  'expense_subcategories' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'expense_subcategories' 
  AND column_name = 'tenant_id'

UNION ALL

SELECT 
  'expense_entries' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'expense_entries' 
  AND column_name = 'tenant_id';

-- =====================================================
-- CONTAGEM DE REGISTROS EXISTENTES (TODOS DEVEM TER tenant_id = NULL)
-- =====================================================

SELECT 
  'revenue_entries' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_com_tenant
FROM revenue_entries

UNION ALL

SELECT 
  'expense_categories' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_com_tenant
FROM expense_categories

UNION ALL

SELECT 
  'expense_subcategories' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_com_tenant
FROM expense_subcategories

UNION ALL

SELECT 
  'expense_entries' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_null,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_com_tenant
FROM expense_entries;

-- =====================================================
-- IMPORTANTE: NENHUMA MUDANÇA NO COMPORTAMENTO!
-- =====================================================
-- 
-- ✅ Todos os registros existentes ficam com tenant_id = NULL
-- ✅ Admin Normal/Operacional continua vendo TUDO (tenant_id = NULL)
-- ✅ Admin Master continua vendo TUDO (NULL + preenchidos)
-- ✅ Client Admin ainda NÃO vê nada (precisa criar novos registros ou migrar dados)
-- 
-- Próximos passos (APENAS DEPOIS DE TESTAR ESTA FASE):
-- - FASE 2: Modificar APIs para aplicar filtros
-- - FASE 3: Modificar Frontend para aplicar filtros
-- - FASE 4: (Opcional) Migrar dados existentes para tenants específicos
-- 
-- =====================================================

