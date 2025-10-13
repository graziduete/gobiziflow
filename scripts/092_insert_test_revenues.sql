-- Script: 092_insert_test_revenues.sql
-- Inserir receitas de teste para o DRE
-- Criado em: 2024-12-19

-- Inserir receitas de teste para diferentes meses de 2024
INSERT INTO revenue_entries (month, date, invoice_number, client, type, due_date, amount, tax_percentage, notes) VALUES
(1, '2024-01-15', 'NF001', 'Empresa A', 'Desenvolvimento', '2024-01-30', 15000.00, 10.00, 'Projeto Sistema A'),
(2, '2024-02-10', 'NF002', 'Empresa B', 'Consultoria', '2024-02-25', 8500.00, 10.00, 'Consultoria Técnica'),
(3, '2024-03-05', 'NF003', 'Empresa C', 'Sustentação', '2024-03-20', 5000.00, 10.00, 'Sustentação Mensal'),
(4, '2024-04-12', 'NF004', 'Empresa A', 'Desenvolvimento', '2024-04-27', 22000.00, 10.00, 'Fase 2 do Projeto'),
(5, '2024-05-08', 'NF005', 'Empresa D', 'Treinamento', '2024-05-23', 3200.00, 10.00, 'Capacitação Equipe'),
(6, '2024-06-20', 'NF006', 'Empresa B', 'Consultoria', '2024-07-05', 12000.00, 10.00, 'Análise de Processos'),
(7, '2024-07-15', 'NF007', 'Empresa C', 'Sustentação', '2024-07-30', 5000.00, 10.00, 'Sustentação Mensal'),
(8, '2024-08-03', 'NF008', 'Empresa E', 'Desenvolvimento', '2024-08-18', 18000.00, 10.00, 'Nova Funcionalidade'),
(9, '2024-09-25', 'NF009', 'Empresa A', 'Desenvolvimento', '2024-10-10', 25000.00, 10.00, 'Fase Final'),
(10, '2024-10-10', 'NF010', 'Empresa F', 'Consultoria', '2024-10-25', 7500.00, 10.00, 'Revisão Arquitetura'),
(11, '2024-11-18', 'NF011', 'Empresa C', 'Sustentação', '2024-12-03', 5000.00, 10.00, 'Sustentação Mensal'),
(12, '2024-12-05', 'NF012', 'Empresa G', 'Desenvolvimento', '2024-12-20', 30000.00, 10.00, 'Projeto End of Year')
ON CONFLICT DO NOTHING;

-- Verificar os dados inseridos
SELECT 
  month,
  COUNT(*) as total_receitas,
  SUM(amount) as total_bruto,
  SUM(tax_amount) as total_impostos,
  SUM(net_amount) as total_liquido
FROM revenue_entries 
WHERE EXTRACT(YEAR FROM date) = 2024
GROUP BY month
ORDER BY month;
