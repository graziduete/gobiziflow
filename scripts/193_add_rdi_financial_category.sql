-- Script: 193_add_rdi_financial_category.sql
-- Adicionar categoria RDI ao DRE
-- Criado em: 2025-01-13
-- Descrição: Adiciona categoria "(-) RDI - Reembolso de Despesas" ao DRE

-- Inserir categoria RDI na tabela financial_categories
INSERT INTO financial_categories (name, type, order_index) VALUES
('(-) RDI (Reembolsos)', 'expense', 17)
ON CONFLICT (name) DO NOTHING;

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
