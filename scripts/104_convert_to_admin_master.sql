-- Script para converter seu perfil para admin_master
-- ⚠️ IMPORTANTE: Substitua 'seu@email.com' pelo seu email real

-- 1. Verificar perfil atual
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'graziely@gobi.consulting';

-- 2. Converter para admin_master (EXECUTE ESTA LINHA)
UPDATE profiles 
SET role = 'admin_master' 
WHERE email = 'graziely@gobi.consulting';

-- 3. Verificar se a conversão foi aplicada
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'graziely@gobi.consulting';

-- 4. Verificar todos os roles no sistema
-- SELECT role, COUNT(*) as quantidade 
-- FROM profiles 
-- GROUP BY role 
-- ORDER BY role;
