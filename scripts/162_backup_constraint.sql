-- BACKUP da constraint atual antes de modificá-la
-- Este script salva a constraint atual para rollback

-- Verificar a constraint atual
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payment_metrics'
AND tc.constraint_type = 'CHECK'
AND cc.check_clause LIKE '%total_hours%';

-- IMPORTANTE: A constraint atual é:
-- payment_metrics_total_hours_check: (total_hours > 0)
