-- Script: 187_verificar_categorias_estrutura.sql
-- Verificar estrutura atual das tabelas de categorias
-- Data: 2025-10-14
-- Descrição: Analisa as tabelas expense_categories e expense_subcategories

-- 1. Verificar estrutura da tabela expense_categories
SELECT 
    'ESTRUTURA EXPENSE_CATEGORIES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expense_categories'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela expense_subcategories
SELECT 
    'ESTRUTURA EXPENSE_SUBCATEGORIES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expense_subcategories'
ORDER BY ordinal_position;

-- 3. Verificar dados existentes em expense_categories
SELECT 
    'DADOS EXPENSE_CATEGORIES' as info,
    id,
    name,
    description,
    created_at
FROM expense_categories
ORDER BY name;

-- 4. Verificar dados existentes em expense_subcategories
SELECT 
    'DADOS EXPENSE_SUBCATEGORIES' as info,
    id,
    category_id,
    name,
    description,
    created_at
FROM expense_subcategories
ORDER BY name;

-- 5. Verificar relacionamento entre as tabelas
SELECT 
    'RELACIONAMENTO CATEGORIAS' as info,
    ec.name as categoria,
    COUNT(esc.id) as total_subcategorias
FROM expense_categories ec
LEFT JOIN expense_subcategories esc ON ec.id = esc.category_id
GROUP BY ec.id, ec.name
ORDER BY ec.name;
