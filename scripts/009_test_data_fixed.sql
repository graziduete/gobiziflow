-- Test Data for Client Project Dashboard (Fixed Version)
-- This script creates sample data for testing the system

-- =============================================================================
-- 1. GET EXISTING USER IDS
-- =============================================================================

-- Create temporary variables for user IDs
DO $$
DECLARE
    admin_user_id UUID;
    client_user_id UUID;
BEGIN
    -- Get the first user as admin (you can modify this logic)
    SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    -- Get the second user as client (or same user if only one exists)
    SELECT id INTO client_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- If only one user exists, use it for both roles
    IF client_user_id IS NULL THEN
        client_user_id := admin_user_id;
    END IF;
    
    -- Store in temporary table for use in subsequent queries
    CREATE TEMP TABLE IF NOT EXISTS temp_users (
        admin_id UUID,
        client_id UUID
    );
    
    DELETE FROM temp_users;
    INSERT INTO temp_users (admin_id, client_id) VALUES (admin_user_id, client_user_id);
END $$;

-- =============================================================================
-- 2. SAMPLE COMPANIES
-- =============================================================================

INSERT INTO public.companies (id, name, description, logo_url, website, contact_email, contact_phone, address, created_by) 
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'TechCorp Solutions',
    'Empresa de tecnologia especializada em desenvolvimento de software e consultoria digital.',
    'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=TC',
    'https://techcorp.com',
    'contato@techcorp.com',
    '+55 11 99999-0001',
    'Av. Paulista, 1000 - São Paulo, SP',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.companies (id, name, description, logo_url, website, contact_email, contact_phone, address, created_by) 
SELECT 
    '22222222-2222-2222-2222-222222222222',
    'Digital Marketing Pro',
    'Agência de marketing digital com foco em resultados e ROI.',
    'https://via.placeholder.com/200x200/059669/FFFFFF?text=DM',
    'https://digitalmarketingpro.com',
    'hello@digitalmarketingpro.com',
    '+55 11 99999-0002',
    'Rua Augusta, 500 - São Paulo, SP',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.companies (id, name, description, logo_url, website, contact_email, contact_phone, address, created_by) 
SELECT 
    '33333333-3333-3333-3333-333333333333',
    'E-commerce Plus',
    'Plataforma completa para vendas online e gestão de e-commerce.',
    'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=EP',
    'https://ecommerceplus.com',
    'suporte@ecommerceplus.com',
    '+55 11 99999-0003',
    'Rua Oscar Freire, 200 - São Paulo, SP',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. UPDATE PROFILES FOR EXISTING USERS
-- =============================================================================

-- Update profiles for existing users
INSERT INTO public.profiles (id, email, full_name, role, is_first_login)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', 
        CASE 
            WHEN au.id = (SELECT admin_id FROM temp_users) THEN 'Admin User'
            ELSE 'Client User'
        END
    ),
    CASE 
        WHEN au.id = (SELECT admin_id FROM temp_users) THEN 'admin'
        ELSE 'client'
    END,
    false
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. USER-COMPANY ASSOCIATIONS
-- =============================================================================

-- Associate admin user with all companies
INSERT INTO public.user_companies (user_id, company_id) 
SELECT admin_id, '11111111-1111-1111-1111-111111111111' FROM temp_users
ON CONFLICT (user_id, company_id) DO NOTHING;

INSERT INTO public.user_companies (user_id, company_id) 
SELECT admin_id, '22222222-2222-2222-2222-222222222222' FROM temp_users
ON CONFLICT (user_id, company_id) DO NOTHING;

INSERT INTO public.user_companies (user_id, company_id) 
SELECT admin_id, '33333333-3333-3333-3333-333333333333' FROM temp_users
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Associate client user with specific companies
INSERT INTO public.user_companies (user_id, company_id) 
SELECT client_id, '11111111-1111-1111-1111-111111111111' FROM temp_users
ON CONFLICT (user_id, company_id) DO NOTHING;

INSERT INTO public.user_companies (user_id, company_id) 
SELECT client_id, '22222222-2222-2222-2222-222222222222' FROM temp_users
ON CONFLICT (user_id, company_id) DO NOTHING;

-- =============================================================================
-- 5. SAMPLE PROJECTS
-- =============================================================================

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) 
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sistema de CRM Personalizado',
    'Desenvolvimento de um sistema CRM completo com dashboard, gestão de leads e relatórios avançados.',
    'in_progress',
    'high',
    '2024-01-15',
    '2024-04-30',
    75000.00,
    '11111111-1111-1111-1111-111111111111',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) 
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Campanha de Marketing Digital Q1',
    'Campanha completa de marketing digital incluindo SEO, Google Ads e redes sociais.',
    'planning',
    'medium',
    '2024-02-01',
    '2024-05-31',
    25000.00,
    '22222222-2222-2222-2222-222222222222',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) 
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Migração para E-commerce',
    'Migração completa da loja física para plataforma de e-commerce com integração de pagamentos.',
    'completed',
    'urgent',
    '2023-10-01',
    '2024-01-15',
    45000.00,
    '33333333-3333-3333-3333-333333333333',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) 
SELECT 
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'App Mobile TechCorp',
    'Desenvolvimento de aplicativo mobile para iOS e Android com sincronização em tempo real.',
    'on_hold',
    'high',
    '2024-03-01',
    '2024-08-30',
    120000.00,
    '11111111-1111-1111-1111-111111111111',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, description, status, priority, start_date, end_date, budget, company_id, created_by) 
SELECT 
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Otimização SEO Avançada',
    'Projeto de otimização SEO completa com auditoria técnica e implementação de melhorias.',
    'in_progress',
    'medium',
    '2024-01-20',
    '2024-06-20',
    18000.00,
    '22222222-2222-2222-2222-222222222222',
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. SAMPLE TASKS
-- =============================================================================

-- Tasks for CRM Project
INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '11111111-aaaa-aaaa-aaaa-111111111111',
    'Análise de Requisitos',
    'Levantamento completo dos requisitos funcionais e não funcionais do sistema CRM.',
    'completed',
    'high',
    '2024-01-25',
    40.0,
    38.5,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '22222222-aaaa-aaaa-aaaa-222222222222',
    'Design da Interface',
    'Criação dos wireframes e protótipos das telas principais do sistema.',
    'in_progress',
    'high',
    '2024-02-15',
    60.0,
    25.0,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '33333333-aaaa-aaaa-aaaa-333333333333',
    'Desenvolvimento Backend',
    'Implementação da API REST e integração com banco de dados.',
    'todo',
    'high',
    '2024-03-30',
    120.0,
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    admin_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Tasks for Marketing Campaign
INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '44444444-bbbb-bbbb-bbbb-444444444444',
    'Pesquisa de Palavras-chave',
    'Análise e seleção das palavras-chave principais para a campanha SEO.',
    'completed',
    'medium',
    '2024-02-10',
    16.0,
    14.5,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '55555555-bbbb-bbbb-bbbb-555555555555',
    'Criação de Conteúdo',
    'Desenvolvimento de conteúdo para blog, redes sociais e campanhas pagas.',
    'in_progress',
    'medium',
    '2024-03-15',
    80.0,
    32.0,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Tasks for E-commerce Migration (Completed Project)
INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '66666666-cccc-cccc-cccc-666666666666',
    'Configuração da Plataforma',
    'Setup inicial da plataforma de e-commerce e configurações básicas.',
    'completed',
    'urgent',
    '2023-11-15',
    24.0,
    26.0,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    admin_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '77777777-cccc-cccc-cccc-777777777777',
    'Migração de Produtos',
    'Importação de todos os produtos do sistema antigo para a nova plataforma.',
    'completed',
    'high',
    '2023-12-20',
    40.0,
    45.0,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Tasks for Mobile App (On Hold)
INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '88888888-dddd-dddd-dddd-888888888888',
    'Prototipação UX/UI',
    'Criação dos protótipos de alta fidelidade para o aplicativo mobile.',
    'review',
    'high',
    '2024-04-15',
    50.0,
    48.0,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Tasks for SEO Optimization
INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    '99999999-eeee-eeee-eeee-999999999999',
    'Auditoria Técnica SEO',
    'Análise completa do site atual identificando problemas técnicos de SEO.',
    'completed',
    'high',
    '2024-02-05',
    20.0,
    18.5,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    admin_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, title, description, status, priority, due_date, estimated_hours, actual_hours, project_id, assigned_to, created_by) 
SELECT 
    'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
    'Otimização On-Page',
    'Implementação das melhorias de SEO on-page identificadas na auditoria.',
    'in_progress',
    'medium',
    '2024-04-30',
    35.0,
    12.0,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    client_id,
    admin_id
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Clean up temporary table
DROP TABLE IF EXISTS temp_users;

-- =============================================================================
-- COMPLETED: Test data created successfully
-- =============================================================================
