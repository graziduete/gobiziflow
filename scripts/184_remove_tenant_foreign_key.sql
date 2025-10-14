-- Script: 184_remove_tenant_foreign_key.sql
-- Remover foreign key constraint da coluna tenant_id
-- Data: 2025-10-14
-- Descrição: Remove a constraint problemática e mantém apenas a coluna

-- 1. Verificar constraints existentes na coluna tenant_id
SELECT 
    'CONSTRAINTS ATUAIS' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'revenue_entries'
  AND kcu.column_name = 'tenant_id';

-- 2. Remover TODAS as constraints de foreign key na coluna tenant_id
ALTER TABLE revenue_entries 
DROP CONSTRAINT IF EXISTS revenue_entries_tenant_id_fkey;

-- 3. Verificar se as constraints foram removidas
SELECT 
    'CONSTRAINTS APÓS REMOÇÃO' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'revenue_entries'
  AND kcu.column_name = 'tenant_id';

-- 4. Testar inserção sem foreign key constraint
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
    'TEST-003',
    'Teste Client Admin Sem FK',
    'Desenvolvimento',
    '2025-11-14',
    1000.00,
    10.0,
    'Teste sem foreign key constraint',
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2'
);

-- 5. Verificar se funcionou
SELECT 
    'TESTE APÓS REMOÇÃO FK' as status,
    id,
    client,
    amount,
    tenant_id,
    created_at
FROM revenue_entries
WHERE invoice_number = 'TEST-003';

-- 6. Limpar o teste
DELETE FROM revenue_entries 
WHERE invoice_number = 'TEST-003';

-- 7. Verificar estrutura final da coluna
SELECT 
    'ESTRUTURA FINAL' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
  AND column_name = 'tenant_id';
