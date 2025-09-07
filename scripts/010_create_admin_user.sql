-- Create admin user profile
-- First, you need to create a user in Supabase Auth manually, then run this script

-- Insert admin profile (replace the UUID with the actual user ID from auth.users)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  -- Replace this UUID with the actual user ID from your Supabase Auth user
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  'Admin Teste',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin Teste',
  updated_at = NOW();

-- Insert client profile (replace the UUID with the actual user ID from auth.users)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  -- Replace this UUID with the actual user ID from your Supabase Auth user
  '11111111-1111-1111-1111-111111111111',
  'cliente@test.com',
  'Cliente Teste',
  'client',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'client',
  full_name = 'Cliente Teste',
  updated_at = NOW();
