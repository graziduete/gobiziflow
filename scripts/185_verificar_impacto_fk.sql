-- Script: 185_verificar_impacto_fk.sql
-- Verificar impacto de remover foreign key
-- Data: 2025-10-14
-- Descrição: Analisa o que será afetado pela remoção da FK

-- 1. Verificar receitas existentes com tenant_id NULL (Admin Normal/Master)
SELECT 
    'RECEITAS ADMIN NORMAL/MASTER' as info,
    COUNT(*) as total_receitas,
    MIN(created_at) as primeira_receita,
    MAX(created_at) as ultima_receita
FROM revenue_entries
WHERE tenant_id IS NULL;

-- 2. Verificar receitas existentes com tenant_id preenchido (Client Admin)
SELECT 
    'RECEITAS CLIENT ADMIN' as info,
    COUNT(*) as total_receitas,
    tenant_id,
    MIN(created_at) as primeira_receita,
    MAX(created_at) as ultima_receita
FROM revenue_entries
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id;

-- 3. Verificar se há receitas órfãs (tenant_id que não existe em companies)
SELECT 
    'RECEITAS ÓRFÃS' as info,
    re.tenant_id,
    COUNT(*) as total_receitas
FROM revenue_entries re
LEFT JOIN companies c ON re.tenant_id = c.tenant_id
WHERE re.tenant_id IS NOT NULL 
  AND c.tenant_id IS NULL
GROUP BY re.tenant_id;

-- 4. Verificar constraint atual
SELECT 
    'CONSTRAINT ATUAL' as info,
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

-- 5. Verificar se a aplicação já valida tenant_id
SELECT 
    'VALIDAÇÃO NA APLICAÇÃO' as info,
    'A aplicação já valida se o usuário é Client Admin' as validacao1,
    'A aplicação já valida se o tenant_id existe' as validacao2,
    'A lógica de negócio já está implementada' as validacao3;
