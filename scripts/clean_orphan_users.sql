-- Script para limpar usuários órfãos (existem no auth mas não no profiles)
-- CUIDADO: Este script remove usuários do sistema de autenticação

-- 1. Verificar usuários órfãos
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    p.id as profile_id,
    p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Para remover um usuário específico (substitua o ID):
-- DELETE FROM auth.users WHERE id = 'ID_DO_USUARIO_AQUI';

-- 3. Para remover usuários órfãos mais antigos que 1 dia:
-- DELETE FROM auth.users 
-- WHERE id NOT IN (SELECT id FROM public.profiles)
-- AND created_at < NOW() - INTERVAL '1 day';
