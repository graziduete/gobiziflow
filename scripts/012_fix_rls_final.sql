-- Remove all existing policies that cause recursion
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Disable RLS temporarily to fix data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Fix the admin user role
UPDATE public.profiles 
SET role = 'admin', is_first_login = false 
WHERE email = 'admin@test.com';

-- Create simple, non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to read all profiles (simplified for now)
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert profiles (for registration)
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Ensure the admin user exists and has correct role
INSERT INTO public.profiles (id, email, full_name, role, is_first_login, created_at, updated_at)
SELECT 
  auth.uid(),
  'admin@test.com',
  'Administrador',
  'admin',
  false,
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_first_login = false,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = now();

-- Create a simple function to check if user is admin (without recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email = 'admin@test.com'
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

COMMENT ON SCRIPT IS 'Fix RLS recursion and set admin user role correctly';
