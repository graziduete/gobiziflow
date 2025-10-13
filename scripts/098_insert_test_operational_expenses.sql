-- Script: 098_insert_test_operational_expenses.sql
-- Descrição: Inserir dados de teste para despesas operacionais (Administrativas, Comerciais, Pessoal, Gerais)
-- Data: 2025-10-03

-- Inserir despesas administrativas (Aluguel, Condomínio, Conta de Luz)
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection) VALUES
-- Janeiro
((SELECT id FROM expense_subcategories WHERE name = 'Aluguel'), 2024, 1, 2500.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Condominio'), 2024, 1, 800.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Conta de Luz'), 2024, 1, 450.00, false),
-- Fevereiro
((SELECT id FROM expense_subcategories WHERE name = 'Aluguel'), 2024, 2, 2500.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Condominio'), 2024, 2, 800.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Conta de Luz'), 2024, 2, 380.00, false),
-- Março
((SELECT id FROM expense_subcategories WHERE name = 'Aluguel'), 2024, 3, 2500.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Condominio'), 2024, 3, 800.00, false),
((SELECT id FROM expense_subcategories WHERE name = 'Conta de Luz'), 2024, 3, 520.00, false);

-- Inserir despesas comerciais (Marketing)
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection) VALUES
-- Janeiro
((SELECT id FROM expense_subcategories WHERE name = 'Marketing'), 2024, 1, 1200.00, false),
-- Fevereiro
((SELECT id FROM expense_subcategories WHERE name = 'Marketing'), 2024, 2, 1500.00, false),
-- Março
((SELECT id FROM expense_subcategories WHERE name = 'Marketing'), 2024, 3, 1800.00, false);

-- Inserir despesas com pessoal (Serviços Advocacia)
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection) VALUES
-- Janeiro
((SELECT id FROM expense_subcategories WHERE name = 'Serviços Advocacia'), 2024, 1, 3000.00, false),
-- Fevereiro
((SELECT id FROM expense_subcategories WHERE name = 'Serviços Advocacia'), 2024, 2, 3000.00, false),
-- Março
((SELECT id FROM expense_subcategories WHERE name = 'Serviços Advocacia'), 2024, 3, 3200.00, false);

-- Inserir despesas gerais (Github)
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection) VALUES
-- Janeiro
((SELECT id FROM expense_subcategories WHERE name = 'Github'), 2024, 1, 100.00, false),
-- Fevereiro
((SELECT id FROM expense_subcategories WHERE name = 'Github'), 2024, 2, 100.00, false),
-- Março
((SELECT id FROM expense_subcategories WHERE name = 'Github'), 2024, 3, 100.00, false);

-- Verificar os dados inseridos
SELECT 
    ec.name as categoria,
    es.name as subcategoria,
    ee.month as mes,
    ee.amount as valor,
    ee.is_projection as projecao
FROM expense_entries ee
JOIN expense_subcategories es ON ee.subcategory_id = es.id
JOIN expense_categories ec ON es.category_id = ec.id
WHERE ee.year = 2024
ORDER BY ec.name, ee.month;

-- Calcular totais por categoria operacional
SELECT 
    ec.name as categoria,
    SUM(ee.amount) as total_anual,
    COUNT(*) as registros
FROM expense_entries ee
JOIN expense_subcategories es ON ee.subcategory_id = es.id
JOIN expense_categories ec ON es.category_id = ec.id
WHERE ee.year = 2024 
AND ec.name IN ('Despesas Administrativas', 'Despesas Comerciais', 'Despesas com Pessoal', 'Despesas Gerais')
GROUP BY ec.name
ORDER BY ec.name;

-- Calcular total geral das despesas operacionais
SELECT 
    'TOTAL DESPESAS OPERACIONAIS' as descricao,
    SUM(ee.amount) as total_anual,
    COUNT(*) as total_registros
FROM expense_entries ee
JOIN expense_subcategories es ON ee.subcategory_id = es.id
JOIN expense_categories ec ON es.category_id = ec.id
WHERE ee.year = 2024 
AND ec.name IN ('Despesas Administrativas', 'Despesas Comerciais', 'Despesas com Pessoal', 'Despesas Gerais');

-- Mensagem de confirmação
SELECT '✅ Dados de teste para despesas operacionais inseridos com sucesso!' as status;


