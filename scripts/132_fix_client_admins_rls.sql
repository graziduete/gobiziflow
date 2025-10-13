-- Script para corrigir a política RLS da tabela client_admins
-- Este script vai ajustar a política para permitir inserção correta

-- 1. Remover a política atual
DROP POLICY IF EXISTS "admin_master_full_access" ON client_admins;

-- 2. Criar nova política que permite admin_master E admin_operacional
CREATE POLICY "admin_full_access" ON client_admins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_master', 'admin_operacional')
  )
);

-- 3. Verificar se a política foi criada
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'client_admins';

-- 4. Testar inserção manual (substitua pelos IDs corretos)
-- Primeiro, busque os IDs:
SELECT 
    p.id as user_id,
    cc.id as company_id
FROM profiles p
CROSS JOIN client_companies cc
WHERE p.email = 'contatoagilepoint@gmail.com'
AND cc.email LIKE '%contatoagilepoint%'
LIMIT 1;

-- Depois, tente inserir:
-- INSERT INTO client_admins (
--     id,
--     company_id,
--     full_name,
--     email,
--     status
-- ) VALUES (
--     '[USER_ID_AQUI]',
--     '[COMPANY_ID_AQUI]',
--     'Grazi Duete',
--     'contatoagilepoint@gmail.com',
--     'active'
-- );
