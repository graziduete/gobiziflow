-- Verificar se há RLS na tabela project_documents
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename = 'project_documents';

-- Verificar políticas RLS na tabela project_documents
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'project_documents';

-- Verificar se há dados na tabela project_documents
SELECT COUNT(*) as total_documents FROM project_documents;

-- Verificar alguns documentos de exemplo
SELECT 
    id,
    project_id,
    file_name,
    uploaded_by,
    uploaded_at
FROM project_documents 
LIMIT 5;
