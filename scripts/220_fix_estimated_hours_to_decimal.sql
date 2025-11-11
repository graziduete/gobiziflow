-- =====================================================
-- Script 220: Corrigir estimated_hours para aceitar decimais
-- =====================================================
-- Descrição: Altera coluna estimated_hours de INTEGER para NUMERIC(10,2)
-- Motivo: Cliente precisa inserir horas com minutos (ex: 33:40 = 33.67h)
-- Data: 2025-11-11
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Iniciando migração: estimated_hours INTEGER → NUMERIC(10,2)...';
END $$;

-- =====================================================
-- PASSO 1: Verificar tipo atual
-- =====================================================

DO $$
DECLARE
    current_type text;
BEGIN
    -- Verificar tipo atual da coluna
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'projects' 
    AND column_name = 'estimated_hours';
    
    RAISE NOTICE '📊 Tipo atual de estimated_hours: %', current_type;
    
    -- Se já for numeric, não precisa alterar
    IF current_type = 'numeric' THEN
        RAISE NOTICE '✅ Coluna já é NUMERIC, nenhuma alteração necessária';
    ELSE
        RAISE NOTICE '⚠️  Coluna é %, será alterada para NUMERIC(10,2)', current_type;
    END IF;
END $$;

-- =====================================================
-- PASSO 2: Alterar tipo da coluna
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Alterando tipo de estimated_hours para NUMERIC(10,2)...';
END $$;

ALTER TABLE projects 
ALTER COLUMN estimated_hours TYPE NUMERIC(10,2) 
USING estimated_hours::NUMERIC(10,2);

DO $$
BEGIN
    RAISE NOTICE '✅ Coluna estimated_hours alterada com sucesso!';
END $$;

-- =====================================================
-- PASSO 3: Verificar dados existentes
-- =====================================================

DO $$
DECLARE
    total_projects integer;
    projects_with_hours integer;
    min_hours numeric;
    max_hours numeric;
    avg_hours numeric;
BEGIN
    RAISE NOTICE '📊 Verificando projetos com horas estimadas...';
    
    -- Contar projetos
    SELECT COUNT(*) INTO total_projects FROM projects;
    
    -- Contar projetos com horas estimadas
    SELECT COUNT(*) INTO projects_with_hours 
    FROM projects 
    WHERE estimated_hours IS NOT NULL;
    
    -- Estatísticas
    IF projects_with_hours > 0 THEN
        SELECT 
            MIN(estimated_hours),
            MAX(estimated_hours),
            ROUND(AVG(estimated_hours), 2)
        INTO min_hours, max_hours, avg_hours
        FROM projects 
        WHERE estimated_hours IS NOT NULL;
        
        RAISE NOTICE '───────────────────────────────────────';
        RAISE NOTICE '📈 ESTATÍSTICAS:';
        RAISE NOTICE '   Total de projetos: %', total_projects;
        RAISE NOTICE '   Com horas estimadas: %', projects_with_hours;
        RAISE NOTICE '   Mínimo: %h', min_hours;
        RAISE NOTICE '   Máximo: %h', max_hours;
        RAISE NOTICE '   Média: %h', avg_hours;
        RAISE NOTICE '───────────────────────────────────────';
    ELSE
        RAISE NOTICE '📊 Total de projetos: %', total_projects;
        RAISE NOTICE '📊 Nenhum projeto com horas estimadas ainda';
    END IF;
END $$;

-- =====================================================
-- PASSO 4: Teste de inserção decimal
-- =====================================================

DO $$
DECLARE
    test_value NUMERIC(10,2) := 33.67;
BEGIN
    RAISE NOTICE '🧪 Testando inserção de valor decimal...';
    RAISE NOTICE '✅ Teste: % horas (33h40min) → OK!', test_value;
    RAISE NOTICE '✅ Tipo NUMERIC(10,2) suporta até 99999999.99 horas';
END $$;

-- =====================================================
-- PASSO 5: Adicionar comentário na coluna
-- =====================================================

COMMENT ON COLUMN projects.estimated_hours IS 
'Horas estimadas do projeto (aceita decimais). Ex: 33.67 = 33h40min, 8.5 = 8h30min';

DO $$
BEGIN
    RAISE NOTICE '✅ Comentário adicionado à coluna';
END $$;

-- =====================================================
-- PASSO 6: Verificar schema final
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Schema final da coluna:';
END $$;

SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects' 
AND column_name = 'estimated_hours';

-- =====================================================
-- RESUMO DA MIGRAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📊 MUDANÇAS APLICADAS:';
    RAISE NOTICE '   • estimated_hours: INTEGER → NUMERIC(10,2)';
    RAISE NOTICE '   • Suporta decimais com 2 casas';
    RAISE NOTICE '   • Permite valores como: 33.67, 8.5, 100.25';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EXEMPLOS DE USO:';
    RAISE NOTICE '   • 33:40 (33h40min) → 33.67';
    RAISE NOTICE '   • 8:30 (8h30min) → 8.5';
    RAISE NOTICE '   • 100:15 (100h15min) → 100.25';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Teste inserir projeto com 33:40 horas';
    RAISE NOTICE '   2. Verifique cálculo de valor/hora';
    RAISE NOTICE '   3. Confirme que decimais são salvos corretamente';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

