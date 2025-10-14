-- Script: 192_add_tenant_expense_entries.sql
-- Adicionar tenant_id na tabela expense_entries
-- Data: 2025-10-14
-- Descrição: Adiciona coluna tenant_id na tabela expense_entries para multi-tenancy

-- 1. Adicionar tenant_id em expense_entries
ALTER TABLE expense_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_expense_entries_tenant_id ON expense_entries(tenant_id);

COMMENT ON COLUMN expense_entries.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal, preenchido para Client Admin';

-- 2. Verificar se a coluna foi criada
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    'expense_entries' as tabela,
    COUNT(*) as total_registros
FROM expense_entries;

-- 3. Verificar estrutura da coluna tenant_id
SELECT 
    'ESTRUTURA tenant_id' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expense_entries'
  AND column_name = 'tenant_id';
