-- FASE 2: IMPLEMENTAÇÃO CAUTELOSA - TABELAS FINANCEIRAS
-- Execute APENAS após confirmar que a Fase 1 funcionou

-- === PASSO 2: TABELAS FINANCEIRAS ===

-- 2.1. Adicionar tenant_id em tabelas financeiras
-- ALTER TABLE revenue_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE expense_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE expense_subcategories ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE financial_categories ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2.2. Adicionar comentários
-- COMMENT ON COLUMN revenue_entries.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN expense_entries.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN expense_categories.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN expense_subcategories.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN financial_categories.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN financial_entries.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- 2.3. Criar índices para performance
-- CREATE INDEX IF NOT EXISTS idx_revenue_entries_tenant_id ON revenue_entries(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_expense_entries_tenant_id ON expense_entries(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant_id ON expense_categories(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_expense_subcategories_tenant_id ON expense_subcategories(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_financial_categories_tenant_id ON financial_categories(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_financial_entries_tenant_id ON financial_entries(tenant_id);

-- === VERIFICAÇÃO ===
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name IN ('revenue_entries', 'expense_entries', 'expense_categories', 'expense_subcategories', 'financial_categories', 'financial_entries')
-- AND column_name = 'tenant_id'
-- ORDER BY table_name;
