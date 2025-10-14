-- Script: 189_add_tenant_categorias.sql
-- Adicionar tenant_id nas tabelas de categorias
-- Data: 2025-10-14
-- Descrição: Adiciona coluna tenant_id nas tabelas expense_categories e expense_subcategories

-- 1. Adicionar tenant_id em expense_categories
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant_id ON expense_categories(tenant_id);

COMMENT ON COLUMN expense_categories.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal, preenchido para Client Admin';

-- 2. Adicionar tenant_id em expense_subcategories
ALTER TABLE expense_subcategories ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_expense_subcategories_tenant_id ON expense_subcategories(tenant_id);

COMMENT ON COLUMN expense_subcategories.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal, preenchido para Client Admin';

-- 3. Verificar se as colunas foram criadas
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    'expense_categories' as tabela,
    COUNT(*) as total_registros
FROM expense_categories

UNION ALL

SELECT 
    'VERIFICAÇÃO FINAL' as info,
    'expense_subcategories' as tabela,
    COUNT(*) as total_registros
FROM expense_subcategories;

-- 4. Verificar estrutura das colunas tenant_id
SELECT 
    'ESTRUTURA tenant_id' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('expense_categories', 'expense_subcategories')
  AND column_name = 'tenant_id'
ORDER BY table_name;
