import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Verificar se o usuário é admin_master
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin_master") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Criar tabela client_companies
    const createCompaniesTable = `
      CREATE TABLE IF NOT EXISTS client_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Tipo de cliente
          type VARCHAR(2) NOT NULL CHECK (type IN ('PJ', 'PF')),
          
          -- Dados para Pessoa Jurídica (PJ)
          corporate_name VARCHAR(255),
          cnpj VARCHAR(18),
          
          -- Dados para Pessoa Física (PF)
          full_name VARCHAR(255),
          cpf VARCHAR(14),
          
          -- E-mail de contato (obrigatório para ambos)
          email VARCHAR(255) NOT NULL,
          
          -- Endereço
          cep VARCHAR(9) NOT NULL,
          street VARCHAR(255) NOT NULL,
          number VARCHAR(10) NOT NULL,
          neighborhood VARCHAR(100) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL,
          
          -- Dados do plano
          plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('teste_7_dias', 'plano_pro')),
          licenses_quantity INTEGER NOT NULL CHECK (licenses_quantity >= 1 AND licenses_quantity <= 10),
          price_per_license DECIMAL(10,2) NOT NULL,
          total_value DECIMAL(12,2) NOT NULL,
          
          -- Dados do cartão
          card_number VARCHAR(19) NOT NULL,
          card_name VARCHAR(100) NOT NULL,
          card_expiry VARCHAR(5) NOT NULL,
          card_cvv VARCHAR(3) NOT NULL,
          
          -- Status da empresa
          status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Criar tabela client_admins
    const createAdminsTable = `
      CREATE TABLE IF NOT EXISTS client_admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Referência à empresa
          company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
          
          -- Dados do administrador
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          
          -- Status do administrador
          status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Criar índices e políticas
    const createIndexesAndPolicies = `
      -- Índices para client_companies
      CREATE INDEX IF NOT EXISTS idx_client_companies_type ON client_companies(type);
      CREATE INDEX IF NOT EXISTS idx_client_companies_email ON client_companies(email);
      CREATE INDEX IF NOT EXISTS idx_client_companies_status ON client_companies(status);
      CREATE INDEX IF NOT EXISTS idx_client_companies_created_at ON client_companies(created_at);

      -- Índices para client_admins
      CREATE INDEX IF NOT EXISTS idx_client_admins_company_id ON client_admins(company_id);
      CREATE INDEX IF NOT EXISTS idx_client_admins_email ON client_admins(email);
      CREATE INDEX IF NOT EXISTS idx_client_admins_status ON client_admins(status);
      CREATE INDEX IF NOT EXISTS idx_client_admins_created_at ON client_admins(created_at);

      -- Triggers para updated_at
      CREATE OR REPLACE FUNCTION update_client_companies_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION update_client_admins_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Aplicar triggers
      DROP TRIGGER IF EXISTS trigger_update_client_companies_updated_at ON client_companies;
      CREATE TRIGGER trigger_update_client_companies_updated_at
          BEFORE UPDATE ON client_companies
          FOR EACH ROW
          EXECUTE FUNCTION update_client_companies_updated_at();

      DROP TRIGGER IF EXISTS trigger_update_client_admins_updated_at ON client_admins;
      CREATE TRIGGER trigger_update_client_admins_updated_at
          BEFORE UPDATE ON client_admins
          FOR EACH ROW
          EXECUTE FUNCTION update_client_admins_updated_at();

      -- Habilitar RLS
      ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE client_admins ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS para admin_master
      DROP POLICY IF EXISTS "admin_master_companies_access" ON client_companies;
      CREATE POLICY "admin_master_companies_access" ON client_companies
          FOR ALL
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM profiles 
                  WHERE profiles.id = auth.uid() 
                  AND profiles.role = 'admin_master'
              )
          );

      DROP POLICY IF EXISTS "admin_master_admins_access" ON client_admins;
      CREATE POLICY "admin_master_admins_access" ON client_admins
          FOR ALL
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM profiles 
                  WHERE profiles.id = auth.uid() 
                  AND profiles.role = 'admin_master'
              )
          );
    `

    // Executar comandos
    const { error: error1 } = await supabase.rpc('exec_sql', { sql_query: createCompaniesTable })
    if (error1) {
      console.error("Erro ao criar tabela companies:", error1)
      return NextResponse.json({ error: "Erro ao criar tabela companies" }, { status: 500 })
    }

    const { error: error2 } = await supabase.rpc('exec_sql', { sql_query: createAdminsTable })
    if (error2) {
      console.error("Erro ao criar tabela admins:", error2)
      return NextResponse.json({ error: "Erro ao criar tabela admins" }, { status: 500 })
    }

    const { error: error3 } = await supabase.rpc('exec_sql', { sql_query: createIndexesAndPolicies })
    if (error3) {
      console.error("Erro ao criar índices e políticas:", error3)
      return NextResponse.json({ error: "Erro ao criar índices e políticas" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Tabelas client_companies e client_admins criadas com sucesso!" 
    })

  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
