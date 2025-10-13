SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payment_metrics'
AND tc.constraint_type = 'CHECK'
AND (cc.check_clause LIKE '%planning_percentage%' OR cc.check_clause LIKE '%homologation_percentage%' OR cc.check_clause LIKE '%completion_percentage%');
