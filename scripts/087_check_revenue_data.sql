-- Script: 087_check_revenue_data.sql
-- Verificar dados da tabela revenue_entries
-- Criado em: 2024-12-19

-- Verificar se a tabela existe
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'revenue_entries'
ORDER BY ordinal_position;

-- Verificar quantos registros existem
SELECT COUNT(*) as total_registros FROM revenue_entries;

-- Verificar os primeiros 5 registros
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
ORDER BY created_at 
LIMIT 5;

-- Verificar se há problemas com os dados
SELECT 
    COUNT(*) as total,
    COUNT(amount) as com_amount,
    COUNT(tax_percentage) as com_tax_percentage,
    COUNT(tax_amount) as com_tax_amount,
    COUNT(net_amount) as com_net_amount
FROM revenue_entries;
