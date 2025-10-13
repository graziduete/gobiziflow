-- Script para testar isolamento de tenant
-- Este script verifica se o RLS está funcionando corretamente

-- 1. Verificar se o client admin da Agile Point existe
SELECT 
    ca.id as admin_id,
    ca.full_name,
    ca.email,
    cc.id as company_id,
    cc.corporate_name
FROM client_admins ca
JOIN client_companies cc ON ca.company_id = cc.id
WHERE cc.email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 2. Inserir dados de teste para o tenant Agile Point
-- (Execute apenas se não existir)
INSERT INTO projects (name, description, tenant_id, created_at, updated_at)
SELECT 
    'Projeto Teste Agile Point',
    'Projeto de teste para verificar isolamento',
    cc.id,
    NOW(),
    NOW()
FROM client_companies cc
WHERE cc.email LIKE '%contatoagilepoint%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Inserir dados de teste para admin principal (tenant_id NULL)
INSERT INTO projects (name, description, tenant_id, created_at, updated_at)
VALUES (
    'Projeto Teste Admin Principal',
    'Projeto de teste para admin principal',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 4. Verificar dados inseridos
SELECT 
    id,
    name,
    description,
    tenant_id,
    CASE 
        WHEN tenant_id IS NULL THEN 'Admin Principal'
        ELSE 'Tenant: ' || tenant_id::text
    END as owner
FROM projects 
WHERE name LIKE '%Projeto Teste%'
ORDER BY tenant_id;

-- 5. Testar política RLS (simular acesso como client admin)
-- NOTA: Este teste só funcionará se executado com o contexto do client admin
-- Para testar, faça login como client admin e execute esta query:
/*
SELECT 
    id,
    name,
    description,
    tenant_id
FROM projects 
WHERE name LIKE '%Projeto Teste%';
*/

-- 6. Comentários para documentação
COMMENT ON TABLE projects IS 'Tabela de projetos com isolamento por tenant_id via RLS';
