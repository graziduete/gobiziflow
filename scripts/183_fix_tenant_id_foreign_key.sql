-- Script: 183_fix_tenant_id_foreign_key.sql
-- Corrigir foreign key constraint da coluna tenant_id
-- Data: 2025-10-14
-- Descrição: Remove a constraint incorreta e cria a correta

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
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'revenue_entries'
  AND kcu.column_name = 'tenant_id';

-- 2. Remover a constraint incorreta
ALTER TABLE revenue_entries 
DROP CONSTRAINT IF EXISTS revenue_entries_tenant_id_fkey;

-- 3. Criar a constraint correta (referenciando companies.tenant_id)
ALTER TABLE revenue_entries 
ADD CONSTRAINT revenue_entries_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES companies(tenant_id);

-- 4. Verificar se a constraint foi criada corretamente
SELECT 
    'CONSTRAINTS APÓS CORREÇÃO' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'revenue_entries'
  AND kcu.column_name = 'tenant_id';

-- 5. Testar inserção novamente
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
    'TEST-002',
    'Teste Client Admin Corrigido',
    'Desenvolvimento',
    '2025-11-14',
    1000.00,
    10.0,
    'Teste após correção da constraint',
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2'
);

-- 6. Verificar se funcionou
SELECT 
    'TESTE APÓS CORREÇÃO' as status,
    id,
    client,
    amount,
    tenant_id,
    created_at
FROM revenue_entries
WHERE invoice_number = 'TEST-002';

-- 7. Limpar o teste
DELETE FROM revenue_entries 
WHERE invoice_number = 'TEST-002';
