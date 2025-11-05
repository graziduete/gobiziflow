-- =====================================================
-- Script: 207_add_hourly_rate_and_safra_to_projects.sql
-- Descrição: Adicionar campos hourly_rate e safra à tabela projects
-- Data: 2025-11-05
-- Objetivo: Implementar campos para valor hora praticado e safra (específico para Copersucar)
-- =====================================================

-- Adicionar campo hourly_rate (valor hora praticado)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(12,2);

-- Adicionar campo safra (específico para Copersucar)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS safra TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.projects.hourly_rate IS 'Valor hora praticado em R$ - usado para calcular orçamento automaticamente (horas * valor_hora)';
COMMENT ON COLUMN public.projects.safra IS 'Campo safra específico para empresa Copersucar (ex: 2025/26, 2026/27, 2027/28)';

-- Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('hourly_rate', 'safra')
ORDER BY column_name;

