-- Script: 093_disable_rls_revenues_final.sql
-- Garantir que RLS está desabilitado para revenue_entries
-- Criado em: 2024-12-19

-- Desabilitar RLS definitivamente
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Apenas admins podem acessar receitas" ON revenue_entries;

-- Verificar se RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'revenue_entries';

-- Inserir receita de teste
INSERT INTO revenue_entries (month, date, invoice_number, client, type, due_date, amount, tax_percentage, notes) 
VALUES (4, '2024-04-01', 'TEST001', 'Cliente Teste', 'Desenvolvimento', '2024-04-15', 10000.00, 10.00, 'Teste DRE')
ON CONFLICT DO NOTHING;

-- Verificar se foi inserida
SELECT * FROM revenue_entries WHERE invoice_number = 'TEST001';
