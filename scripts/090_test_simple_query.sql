-- Script: 090_test_simple_query.sql
-- Teste simples de consulta
-- Criado em: 2024-12-19

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'revenue_entries'
) as tabela_existe;

-- Inserir um registro de teste simples
INSERT INTO revenue_entries (month, date, invoice_number, client, type, due_date, amount, tax_percentage) 
VALUES (1, '2024-01-01', 'TEST001', 'Cliente Teste', 'Teste', '2024-01-15', 1000.00, 10.00)
ON CONFLICT DO NOTHING;

-- Verificar se o registro foi inserido
SELECT * FROM revenue_entries WHERE invoice_number = 'TEST001';
