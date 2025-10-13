-- Script: 088_insert_test_revenue_data.sql
-- Inserir dados de teste na tabela revenue_entries
-- Criado em: 2024-12-19

-- Limpar dados existentes (se houver)
DELETE FROM revenue_entries;

-- Inserir dados de teste
INSERT INTO revenue_entries (month, date, invoice_number, client, type, due_date, amount, tax_percentage, notes) VALUES
(4, '2024-04-01', '489', 'Alvean', 'Sustentação', '2024-04-16', 1755.00, 10.00, 'Ref Fevereiro'),
(5, '2024-05-02', '490', 'Ambipar', 'Desenvolvimento', '2024-05-07', 21900.00, 15.00, 'Parcela 2 e 3 - R4'),
(6, '2024-06-04', '491', 'Instituto Votorar', 'Treinamento Sistema Gestão', '2024-06-14', 14737.48, 8.50, 'Melhorias Check-list e App iOS'),
(7, '2024-07-03', '492', 'Copersucar', 'Melhorias Siga Unidades', '2024-07-13', 284124.54, 12.00, 'Parcela 5 de 5'),
(4, '2024-04-15', '493', 'Alvean', 'Sustentação', '2024-04-30', 2500.00, 10.00, 'Ref Março'),
(5, '2024-05-20', '494', 'Ambipar', 'Consultoria', '2024-06-05', 8500.00, 15.00, 'Análise de Processos'),
(6, '2024-06-10', '495', 'Instituto Votorar', 'Desenvolvimento', '2024-06-25', 12000.00, 8.50, 'Ref Abril'),
(7, '2024-07-15', '496', 'Copersucar', 'Ajustes Siga Unidades', '2024-07-30', 45000.00, 12.00, 'Ref Maio'),
(8, '2024-08-01', '497', 'Alvean', 'Sustentação', '2024-08-15', 1800.00, 10.00, 'Ref Junho'),
(8, '2024-08-10', '498', 'Ambipar', 'Treinamento', '2024-08-25', 5500.00, 15.00, 'Capacitação Equipe');

-- Verificar se os dados foram inseridos
SELECT 
    id,
    month,
    date,
    invoice_number,
    client,
    type,
    amount,
    tax_percentage,
    tax_amount,
    net_amount
FROM revenue_entries 
ORDER BY created_at;
