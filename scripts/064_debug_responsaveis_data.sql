-- Script para debugar dados da tabela responsaveis
-- Executar no Supabase SQL Editor

-- 1. Verificar se a tabela existe e tem dados
SELECT COUNT(*) as total_responsaveis FROM responsaveis;

-- 2. Listar todos os responsáveis
SELECT id, nome, email, empresa, ativo FROM responsaveis ORDER BY created_at DESC;

-- 3. Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'responsaveis';

-- 4. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'responsaveis';

-- 5. Testar acesso sem RLS (temporariamente)
-- Desabilitar RLS temporariamente
ALTER TABLE responsaveis DISABLE ROW LEVEL SECURITY;

-- Verificar dados sem RLS
SELECT id, nome, email FROM responsaveis LIMIT 5;

-- Reabilitar RLS
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

-- 6. Verificar usuário atual
SELECT auth.uid() as current_user_id;

-- 7. Verificar se o usuário atual tem perfil admin
SELECT id, role, full_name, email 
FROM profiles 
WHERE id = auth.uid();
