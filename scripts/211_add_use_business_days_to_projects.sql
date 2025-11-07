-- =====================================================
-- Script: 211_add_use_business_days_to_projects.sql
-- Descrição: Adicionar campo para controle de dias úteis vs dias corridos
-- Data: 2025-11-07
-- Objetivo: Permitir escolha se cálculos usam apenas dias úteis (seg-sex)
-- =====================================================

-- Adicionar coluna para controle de dias úteis
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS use_business_days BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.projects.use_business_days IS 'Se true, cálculos de duração e datas previstas consideram apenas dias úteis (segunda a sexta), excluindo fins de semana. Se false, usa dias corridos (todos os dias).';

-- Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'use_business_days';

-- Estatísticas
SELECT 
    'ESTATÍSTICAS' as info,
    COUNT(*) as total_projetos,
    COUNT(CASE WHEN use_business_days = true THEN 1 END) as projetos_dias_uteis,
    COUNT(CASE WHEN use_business_days = false THEN 1 END) as projetos_dias_corridos
FROM projects;

