-- scripts/030_add_admin_operacional_role.sql
-- IMPORTANTE: Este script é 100% seguro - apenas adiciona um novo role
-- Não modifica dados existentes nem quebra funcionalidades

-- 1. Remover constraint atual
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar novo constraint com admin_operacional
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'admin_operacional', 'client'));

-- 3. Comentário para documentação
COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS 
'Permite roles: admin (acesso total), admin_operacional (acesso limitado), client (acesso básico)';

-- 4. Verificar se a alteração foi aplicada
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'profiles_role_check';