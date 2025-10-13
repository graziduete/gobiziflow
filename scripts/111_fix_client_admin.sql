-- Script para corrigir o client_admin que foi criado incorretamente
-- Este script vai corrigir o role e flags do usuário

-- Corrigir o usuário específico
UPDATE profiles 
SET 
    role = 'client_admin',
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
