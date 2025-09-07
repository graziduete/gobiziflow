-- Completely disable RLS on all tables to resolve infinite recursion
-- Remove all existing policies that cause recursion
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_select_associated" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_admin" ON public.companies;
DROP POLICY IF EXISTS "projects_select_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_select_associated" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_update_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
DROP POLICY IF EXISTS "tasks_select_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_assigned" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_admin" ON public.tasks;
DROP POLICY IF EXISTS "user_companies_select_admin" ON public.user_companies;
DROP POLICY IF EXISTS "user_companies_select_own" ON public.user_companies;
DROP POLICY IF EXISTS "user_companies_insert_admin" ON public.user_companies;
DROP POLICY IF EXISTS "user_companies_update_admin" ON public.user_companies;
DROP POLICY IF EXISTS "user_companies_delete_admin" ON public.user_companies;

-- Disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies DISABLE ROW LEVEL SECURITY;

-- Ensure admin user exists with correct role
UPDATE public.profiles 
SET role = 'admin', is_first_login = false 
WHERE email = 'admin@test.com';

-- Insert admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role, is_first_login, created_at, updated_at)
SELECT 
  auth.users.id,
  'admin@test.com',
  'Administrador',
  'admin',
  false,
  NOW(),
  NOW()
FROM auth.users 
WHERE auth.users.email = 'admin@test.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'admin@test.com'
);

-- Create some test data if tables are empty
INSERT INTO public.companies (id, name, email, phone, address, logo_url, created_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Empresa Teste',
  'contato@empresateste.com',
  '(11) 99999-9999',
  'Rua Teste, 123',
  NULL,
  (SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);

COMMIT;
