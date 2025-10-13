-- Script 149: Criar função helper para obter tenant_id do usuário logado
-- Este script APENAS cria a função, NÃO habilita RLS ainda
-- É seguro executar - não afeta o funcionamento atual do sistema

-- ============================================
-- 1. CRIAR FUNÇÃO HELPER
-- ============================================

-- Remover função existente se houver
DROP FUNCTION IF EXISTS get_user_tenant_id();

-- Criar função que retorna o tenant_id baseado no usuário logado
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    user_role TEXT;
    user_is_client_admin BOOLEAN;
    tenant_id_val UUID;
BEGIN
    -- Buscar role e flag is_client_admin do usuário logado
    SELECT role, COALESCE(is_client_admin, FALSE)
    INTO user_role, user_is_client_admin
    FROM profiles
    WHERE id = auth.uid();

    -- Se não encontrou o usuário, retornar NULL (acesso negado ou usuário não existe)
    IF user_role IS NULL THEN
        RETURN NULL;
    END IF;

    -- Admin Master tem acesso a TUDO (retorna NULL = sem filtro)
    IF user_role = 'admin_master' THEN
        RETURN NULL;
    END IF;

    -- Admin e Admin Operacional (não client_admin) têm acesso a TUDO
    IF (user_role = 'admin' OR user_role = 'admin_operacional') AND user_is_client_admin = FALSE THEN
        RETURN NULL;
    END IF;

    -- Client Admin: retorna o company_id da tabela client_admins
    IF user_is_client_admin = TRUE THEN
        SELECT company_id
        INTO tenant_id_val
        FROM client_admins
        WHERE id = auth.uid();
        RETURN tenant_id_val;
    END IF;

    -- Clientes normais: por enquanto retornam NULL
    -- TODO: Implementar lógica para clientes normais quando necessário
    IF user_role = 'client' THEN
        RETURN NULL;
    END IF;

    -- Fallback: retornar NULL (acesso total por segurança)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. ADICIONAR COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION get_user_tenant_id IS 'Retorna o tenant_id (company_id) do usuário logado para filtrar dados. Retorna NULL para admin_master e admin/admin_operacional (acesso total). Retorna company_id para client_admin (acesso isolado).';

-- ============================================
-- 3. CONCEDER PERMISSÕES
-- ============================================

-- Garantir que usuários autenticados possam executar a função
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================

-- Verificar se a função foi criada corretamente
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_user_tenant_id';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- A função foi criada com sucesso
-- O sistema continua funcionando normalmente (RLS ainda não está ativo)
-- Próximo passo: executar script 150 para TESTAR a função

