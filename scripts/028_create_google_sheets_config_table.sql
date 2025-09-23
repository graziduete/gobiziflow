-- Script 028: Criar tabela para configurações de Google Sheets
-- IMPORTANTE: Esta tabela é SEPARADA e NÃO afeta a Copersucar
-- A Copersucar continua usando hardcoded (GOOGLE_SHEETS_COPERCUSAR_ID)

-- Criar tabela para configurações de Google Sheets por empresa
CREATE TABLE IF NOT EXISTS public.sustentacao_google_sheets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  tab_name TEXT NOT NULL DEFAULT 'Página1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraint para garantir apenas uma configuração ativa por empresa
  CONSTRAINT unique_active_google_sheets_config 
    UNIQUE (company_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_sustentacao_google_sheets_config_company_id 
ON public.sustentacao_google_sheets_config(company_id);

CREATE INDEX IF NOT EXISTS idx_sustentacao_google_sheets_config_active 
ON public.sustentacao_google_sheets_config(is_active) 
WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.sustentacao_google_sheets_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "google_sheets_config_select_admin"
  ON public.sustentacao_google_sheets_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "google_sheets_config_insert_admin"
  ON public.sustentacao_google_sheets_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "google_sheets_config_update_admin"
  ON public.sustentacao_google_sheets_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "google_sheets_config_delete_admin"
  ON public.sustentacao_google_sheets_config FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para clientes verem apenas sua empresa
CREATE POLICY "google_sheets_config_select_client"
  ON public.sustentacao_google_sheets_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = sustentacao_google_sheets_config.company_id 
      AND uc.user_id = auth.uid()
    )
  );

-- Comentário explicativo
COMMENT ON TABLE public.sustentacao_google_sheets_config IS 
'Tabela para configurações de Google Sheets por empresa. A Copersucar continua usando hardcoded.';

COMMENT ON COLUMN public.sustentacao_google_sheets_config.company_id IS 
'ID da empresa (exceto Copersucar que usa hardcoded)';

COMMENT ON COLUMN public.sustentacao_google_sheets_config.spreadsheet_id IS 
'ID da planilha do Google Sheets';

COMMENT ON COLUMN public.sustentacao_google_sheets_config.tab_name IS 
'Nome da aba da planilha (padrão: Página1)';

COMMENT ON COLUMN public.sustentacao_google_sheets_config.is_active IS 
'Se a configuração está ativa (apenas uma por empresa)';