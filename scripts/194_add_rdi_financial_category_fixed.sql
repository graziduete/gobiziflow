-- Script: 194_add_rdi_financial_category_fixed.sql
-- Adicionar categoria RDI ao DRE (VERSÃO CORRIGIDA)
-- Criado em: 2025-01-13
-- Descrição: Adiciona categoria "(-) RDI (Reembolsos)" ao DRE

-- Verificar se a categoria já existe antes de inserir
DO $$
BEGIN
    -- Inserir categoria RDI na tabela financial_categories apenas se não existir
    IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = '(-) RDI (Reembolsos)') THEN
        INSERT INTO financial_categories (name, type, order_index) VALUES
        ('(-) RDI (Reembolsos)', 'expense', 17);
        
        RAISE NOTICE 'Categoria RDI inserida com sucesso!';
    ELSE
        RAISE NOTICE 'Categoria RDI já existe!';
    END IF;
END $$;

-- Verificar se a categoria foi inserida
SELECT 
    'VERIFICAÇÃO' as info,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN name = '(-) RDI (Reembolsos)' THEN 1 END) as categoria_rdi_existe
FROM financial_categories;

-- Mostrar todas as categorias de despesas
SELECT 
    'CATEGORIAS DE DESPESAS' as info,
    name,
    type,
    order_index
FROM financial_categories 
WHERE type = 'expense'
ORDER BY order_index;
