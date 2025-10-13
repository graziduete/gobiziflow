-- Habilitar RLS na tabela project_documents
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Política para Admin Master - acesso total
CREATE POLICY "project_documents_admin_master_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin_master'
  )
);

-- Política para Admin Normal/Operacional - acesso a projetos que podem ver
CREATE POLICY "project_documents_admin_operacional_select" ON project_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'admin_operacional')
  )
  AND EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = project_documents.project_id
    AND (
      -- Admin Normal/Operacional pode ver projetos sem tenant_id
      pr.tenant_id IS NULL
      OR
      -- Ou projetos onde o usuário está associado via user_companies
      EXISTS (
        SELECT 1 FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.company_id = pr.company_id
      )
    )
  )
);

-- Política para Admin Normal/Operacional - upload de documentos
CREATE POLICY "project_documents_admin_operacional_insert" ON project_documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'admin_operacional')
  )
  AND EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = project_documents.project_id
    AND (
      -- Admin Normal/Operacional pode editar projetos sem tenant_id
      pr.tenant_id IS NULL
      OR
      -- Ou projetos onde o usuário está associado via user_companies
      EXISTS (
        SELECT 1 FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.company_id = pr.company_id
      )
    )
  )
);

-- Política para Admin Normal/Operacional - deletar documentos
CREATE POLICY "project_documents_admin_operacional_delete" ON project_documents
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'admin_operacional')
  )
  AND EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = project_documents.project_id
    AND (
      -- Admin Normal/Operacional pode deletar documentos de projetos sem tenant_id
      pr.tenant_id IS NULL
      OR
      -- Ou projetos onde o usuário está associado via user_companies
      EXISTS (
        SELECT 1 FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.company_id = pr.company_id
      )
    )
  )
);

-- Política para Client Admin - acesso apenas aos projetos do seu tenant
CREATE POLICY "project_documents_client_admin_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.is_client_admin = true
  )
  AND EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = project_documents.project_id
    AND pr.tenant_id = (
      SELECT ca.company_id 
      FROM client_admins ca 
      WHERE ca.user_id = auth.uid()
    )
  )
);
