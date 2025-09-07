-- Test Data for Client Project Dashboard
-- This script creates sample data for testing the system

-- =============================================================================
-- 1. SAMPLE COMPANIES
-- =============================================================================

-- Insert sample companies (you'll need to replace the created_by UUIDs with actual admin user IDs)
INSERT INTO public.companies (id, name, description, logo_url, website, contact_email, contact_phone, address, created_by) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'TechCorp Solutions',
  'Empresa de tecnologia especializada em desenvolvimento de software e consultoria digital.',
  'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=TC',
  'https://techcorp.com',
  'contato@techcorp.com',
  '+55 11 99999-0001',
  'Av. Paulista, 1000 - São Paulo, SP',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '22222222-2222-2222-2222-222222222222',
  'Digital Marketing Pro',
  'Agência de marketing digital com foco em resultados e ROI.',
  'https://via.placeholder.com/200x200/059669/FFFFFF?text=DM',
  'https://digitalmarketingpro.com',
  'hello@digitalmarketingpro.com',
  '+55 11 99999-0002',
  'Rua Augusta, 500 - São Paulo, SP',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '33333333-3333-3333-3333-333333333333',
  'E-commerce Plus',
  'Plataforma completa para vendas online e gestão de e-commerce.',
  'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=EP',
  'https://ecommerceplus.com',
  'suporte@ecommerceplus.com',
  '+55 11 99999-0003',
  'Rua Oscar Freire, 200 - São Paulo, SP',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. USER-COMPANY ASSOCIATIONS
-- =============================================================================

-- Associate users with companies (replace with actual user IDs)
INSERT INTO public.user_companies (user_id, company_id) VALUES
-- Admin user associated with all companies
((SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), '11111111-1111-1111-1111-111111111111'),
((SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), '22222222-2222-2222-2222-222222222222'),
((SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1), '33333333-3333-3333-3333-333333333333'),

-- Client user associated with specific companies
((SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1), '11111111-1111-1111-1111-111111111111'),
((SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1), '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id, company_id) DO NOTHING;

-- =============================================================================
-- 3. SAMPLE PROJECTS
-- =============================================================================

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Sistema de CRM Personalizado',
  'Desenvolvimento de um sistema CRM completo com dashboard, gestão de leads e relatórios avançados.',
  'in_progress',
  'high',
  '2024-01-15',
  '2024-04-30',
  75000.00,
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Campanha de Marketing Digital Q1',
  'Campanha completa de marketing digital incluindo SEO, Google Ads e redes sociais.',
  'planning',
  'medium',
  '2024-02-01',
  '2024-05-31',
  25000.00,
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Migração para E-commerce',
  'Migração completa da loja física para plataforma de e-commerce com integração de pagamentos.',
  'completed',
  'urgent',
  '2023-10-01',
  '2024-01-15',
  45000.00,
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'App Mobile TechCorp',
  'Desenvolvimento de aplicativo mobile para iOS e Android com sincronização em tempo real.',
  'on_hold',
  'high',
  '2024-03-01',
  '2024-08-30',
  120000.00,
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Otimização SEO Avançada',
  'Projeto de otimização SEO completa com auditoria técnica e implementação de melhorias.',
  'in_progress',
  'medium',
  '2024-01-20',
  '2024-06-20',
  18000.00,
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. SAMPLE TASKS
-- =============================================================================

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) VALUES
-- Tasks for CRM Project
(
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'Análise de Requisitos',
  'Levantamento completo dos requisitos funcionais e não funcionais do sistema CRM.',
  'completed',
  'high',
  '2024-01-25',
  40.0,
  38.5,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '22222222-aaaa-aaaa-aaaa-222222222222',
  'Design da Interface',
  'Criação dos wireframes e protótipos das telas principais do sistema.',
  'in_progress',
  'high',
  '2024-02-15',
  60.0,
  25.0,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '33333333-aaaa-aaaa-aaaa-333333333333',
  'Desenvolvimento Backend',
  'Implementação da API REST e integração com banco de dados.',
  'todo',
  'high',
  '2024-03-30',
  120.0,
  NULL,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),

-- Tasks for Marketing Campaign
(
  '44444444-bbbb-bbbb-bbbb-444444444444',
  'Pesquisa de Palavras-chave',
  'Análise e seleção das palavras-chave principais para a campanha SEO.',
  'completed',
  'medium',
  '2024-02-10',
  16.0,
  14.5,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '55555555-bbbb-bbbb-bbbb-555555555555',
  'Criação de Conteúdo',
  'Desenvolvimento de conteúdo para blog, redes sociais e campanhas pagas.',
  'in_progress',
  'medium',
  '2024-03-15',
  80.0,
  32.0,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),

-- Tasks for E-commerce Migration (Completed Project)
(
  '66666666-cccc-cccc-cccc-666666666666',
  'Configuração da Plataforma',
  'Setup inicial da plataforma de e-commerce e configurações básicas.',
  'completed',
  'urgent',
  '2023-11-15',
  24.0,
  26.0,
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  '77777777-cccc-cccc-cccc-777777777777',
  'Migração de Produtos',
  'Importação de todos os produtos do sistema antigo para a nova plataforma.',
  'completed',
  'high',
  '2023-12-20',
  40.0,
  45.0,
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),

-- Tasks for Mobile App (On Hold)
(
  '88888888-dddd-dddd-dddd-888888888888',
  'Prototipação UX/UI',
  'Criação dos protótipos de alta fidelidade para o aplicativo mobile.',
  'review',
  'high',
  '2024-04-15',
  50.0,
  48.0,
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),

-- Tasks for SEO Optimization
(
  '99999999-eeee-eeee-eeee-999999999999',
  'Auditoria Técnica SEO',
  'Análise completa do site atual identificando problemas técnicos de SEO.',
  'completed',
  'high',
  '2024-02-05',
  20.0,
  18.5,
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
),
(
  'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
  'Otimização On-Page',
  'Implementação das melhorias de SEO on-page identificadas na auditoria.',
  'in_progress',
  'medium',
  '2024-04-30',
  35.0,
  12.0,
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  (SELECT id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. UPDATE PROFILES FOR EXISTING USERS
-- =============================================================================

-- Update profiles for existing users (this will help if profiles weren't created automatically)
INSERT INTO public.profiles (id, email, full_name, role, is_first_login)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Usuário Teste'),
  CASE 
    WHEN au.email LIKE '%admin%' THEN 'admin'
    ELSE 'client'
  END,
  false
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- =============================================================================
-- COMPLETED: Test data created successfully
-- =============================================================================

-- Summary of created test data:
-- - 3 Companies: TechCorp Solutions, Digital Marketing Pro, E-commerce Plus
-- - 5 Projects: CRM System, Marketing Campaign, E-commerce Migration, Mobile App, SEO Optimization
-- - 10 Tasks: Various tasks across all projects with different statuses and priorities
-- - User-Company associations for testing different access levels
-- - Updated profiles for existing auth users
