-- Script: 182_test_revenue_insert.sql
-- Testar inserção de receita para Client Admin
-- Data: 2025-10-14
-- Descrição: Testa se conseguimos inserir uma receita com tenant_id do Client Admin

-- 1. Verificar se a tabela revenue_entries aceita o tenant_id
SELECT 
    'ESTRUTURA REVENUE_ENTRIES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
  AND column_name = 'tenant_id';

-- 2. Testar inserção de receita com tenant_id do Client Admin
INSERT INTO revenue_entries (
    month,
    date,
    invoice_number,
    client,
    type,
    due_date,
    amount,
    tax_percentage,
    notes,
    tenant_id
) VALUES (
    10,
    '2025-10-14',
    'TEST-001',
    'Teste Client Admin',
    'Desenvolvimento',
    '2025-11-14',
    1000.00,
    10.0,
    'Teste de inserção',
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2'  -- tenant_id do Client Admin
);

-- 3. Verificar se a receita foi inserida
SELECT 
    'RECEITA INSERIDA' as status,
    id,
    client,
    amount,
    tenant_id,
    created_at
FROM revenue_entries
WHERE tenant_id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Limpar o teste
DELETE FROM revenue_entries 
WHERE tenant_id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2' 
  AND invoice_number = 'TEST-001';
