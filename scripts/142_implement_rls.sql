-- Script para implementar RLS (Row Level Security) com tenant_id
-- Este script cria políticas para isolamento de dados por tenant

-- 1. Habilitar RLS nas tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Política para projects
DROP POLICY IF EXISTS "projects_tenant_isolation" ON projects;
CREATE POLICY "projects_tenant_isolation" ON projects
FOR ALL TO authenticated
USING (
    -- Admin principal vê tudo (tenant_id IS NULL)
    tenant_id IS NULL
    OR
    -- Client admin vê apenas seu tenant
    tenant_id = (
        SELECT client_companies.id 
        FROM client_admins 
        JOIN client_companies ON client_admins.company_id = client_companies.id
        WHERE client_admins.id = auth.uid()
    )
);

-- 3. Política para companies
DROP POLICY IF EXISTS "companies_tenant_isolation" ON companies;
CREATE POLICY "companies_tenant_isolation" ON companies
FOR ALL TO authenticated
USING (
    -- Admin principal vê tudo (tenant_id IS NULL)
    tenant_id IS NULL
    OR
    -- Client admin vê apenas seu tenant
    tenant_id = (
        SELECT client_companies.id 
        FROM client_admins 
        JOIN client_companies ON client_admins.company_id = client_companies.id
        WHERE client_admins.id = auth.uid()
    )
);

-- 4. Política para profiles
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;
CREATE POLICY "profiles_tenant_isolation" ON profiles
FOR ALL TO authenticated
USING (
    -- Admin principal vê tudo (tenant_id IS NULL)
    tenant_id IS NULL
    OR
    -- Client admin vê apenas seu tenant
    tenant_id = (
        SELECT client_companies.id 
        FROM client_admins 
        JOIN client_companies ON client_admins.company_id = client_companies.id
        WHERE client_admins.id = auth.uid()
    )
);

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'companies', 'profiles')
AND schemaname = 'public'
ORDER BY tablename;

-- 6. Verificar políticas criadas
SELECT 
    policyname,
    tablename,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('projects', 'companies', 'profiles')
ORDER BY tablename, policyname;
