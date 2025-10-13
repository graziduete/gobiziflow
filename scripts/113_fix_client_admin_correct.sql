-- Script para corrigir o client_admin com a arquitetura correta
-- Client admin deve ter role "admin" (não "client_admin") e flag is_client_admin = true

-- Corrigir o usuário específico
UPDATE profiles 
SET 
    role = 'admin',
    is_client_admin = true,
    first_login_completed = false,
    updated_at = NOW()
WHERE email = 'contatoagilepoint@gmail.com'
AND role = 'client';

-- Verificar se a correção foi aplicada
SELECT 
    id,
    full_name,
    email,
    role,
    is_client_admin,
    first_login_completed,
    updated_at
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com';
