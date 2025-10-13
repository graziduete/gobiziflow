-- Script para verificar qual é o role do usuário atual
-- Este script vai mostrar qual usuário está logado e qual é seu role

-- 1. Verificar o usuário atual autenticado
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_auth_role;

-- 2. Verificar o perfil do usuário atual
SELECT 
    id,
    email,
    role,
    is_client_admin,
    full_name
FROM profiles 
WHERE id = auth.uid();

-- 3. Verificar se o usuário atual tem permissão para inserir em client_admins
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin_master', 'admin_operacional')
        ) THEN 'PERMITIDO'
        ELSE 'BLOQUEADO'
    END as permissao_client_admins;
