-- Script para corrigir o trigger de criação de usuários
-- Este script atualiza o trigger para incluir first_login_completed

-- 1. Atualizar a função handle_new_user para incluir first_login_completed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_first_login, first_login_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
    true, -- Sempre true para novos usuários
    false -- Sempre false para novos usuários (precisa redefinir senha)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_first_login = EXCLUDED.is_first_login,
    first_login_completed = EXCLUDED.first_login_completed,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Atualizar usuários existentes que não têm first_login_completed definido
UPDATE public.profiles 
SET first_login_completed = CASE 
  WHEN is_first_login = true THEN false
  ELSE true
END
WHERE first_login_completed IS NULL;

-- 4. Verificar se a função foi atualizada
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 5. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Função para criar perfil automaticamente quando novo usuário é criado no Supabase Auth, incluindo flags de primeiro login';
