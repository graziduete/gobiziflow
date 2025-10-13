-- ROLLBACK: Restaurar a constraint original
-- Execute este script SE algo quebrar após a modificação

-- Remover a constraint modificada
ALTER TABLE payment_metrics DROP CONSTRAINT IF EXISTS payment_metrics_total_hours_check;

-- Restaurar a constraint original
ALTER TABLE payment_metrics ADD CONSTRAINT payment_metrics_total_hours_check 
CHECK (total_hours > 0);

-- Verificar se foi restaurada
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payment_metrics'
AND tc.constraint_type = 'CHECK'
AND cc.check_clause LIKE '%total_hours%';
