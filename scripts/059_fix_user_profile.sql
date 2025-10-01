-- Script para verificar e corrigir perfil do usuário
-- Executar no Supabase SQL Editor

-- Verificar usuários sem perfil
SELECT 
  au.id as user_id,
  au.email,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verificar usuários com perfil
SELECT 
  au.id as user_id,
  au.email,
  p.role,
  p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
ORDER BY p.created_at DESC;

-- Se necessário, criar perfil para usuário sem perfil
-- Substitua 'USER_ID_AQUI' pelo ID do usuário que está com problema
-- INSERT INTO profiles (id, role, full_name, email, created_at, updated_at)
-- VALUES (
--   'USER_ID_AQUI',
--   'admin',
--   'Nome do Usuário',
--   'email@exemplo.com',
--   NOW(),
--   NOW()
-- );

-- Verificar RLS da tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
