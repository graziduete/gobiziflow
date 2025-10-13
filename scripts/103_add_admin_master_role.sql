-- Script para adicionar role admin_master
-- Este script é seguro e reversível

-- 1. Remover constraint atual
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar nova constraint com admin_master
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'admin_operacional', 'client', 'admin_master'));

-- 3. Verificar roles existentes
SELECT role, COUNT(*) as quantidade 
FROM profiles 
GROUP BY role 
ORDER BY role;

-- 4. Comentário para conversão manual
-- Para converter seu perfil para admin_master, execute:
-- UPDATE profiles 
-- SET role = 'admin_master' 
-- WHERE email = 'seu@email.com';

-- 5. Verificar se a alteração foi aplicada
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'admin_master';

