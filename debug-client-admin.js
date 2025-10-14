// Script para debug do Client Admin
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase (usar as mesmas do projeto)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugClientAdmin() {
  console.log('🔍 [DEBUG] Iniciando debug do Client Admin...')
  
  // ID do Client Admin que está com problema
  const clientAdminId = 'a184600e-b2f0-4905-9af1-7a6ff4698d84'
  
  console.log('🔍 [DEBUG] User ID:', clientAdminId)
  
  // 1. Verificar se existe na tabela profiles
  console.log('\n1️⃣ Verificando tabela profiles...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_client_admin, full_name, email')
    .eq('id', clientAdminId)
    .single()
  
  console.log('Profile:', profile)
  console.log('Profile Error:', profileError)
  
  if (profileError) {
    console.error('❌ Erro ao buscar profile:', profileError)
    return
  }
  
  if (!profile) {
    console.error('❌ Profile não encontrado')
    return
  }
  
  // 2. Verificar se existe na tabela client_admins
  console.log('\n2️⃣ Verificando tabela client_admins...')
  const { data: clientAdmin, error: clientAdminError } = await supabase
    .from('client_admins')
    .select('id, company_id, email')
    .eq('id', clientAdminId)
    .single()
  
  console.log('Client Admin:', clientAdmin)
  console.log('Client Admin Error:', clientAdminError)
  
  if (clientAdminError) {
    console.error('❌ Erro ao buscar client_admin:', clientAdminError)
    return
  }
  
  if (!clientAdmin) {
    console.error('❌ Client Admin não encontrado na tabela client_admins')
    return
  }
  
  // 3. Verificar se a company_id existe na tabela companies
  console.log('\n3️⃣ Verificando company_id na tabela companies...')
  if (clientAdmin.company_id) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, tenant_id')
      .eq('id', clientAdmin.company_id)
      .single()
    
    console.log('Company:', company)
    console.log('Company Error:', companyError)
    
    if (companyError) {
      console.error('❌ Erro ao buscar company:', companyError)
      return
    }
    
    if (!company) {
      console.error('❌ Company não encontrada')
      return
    }
  }
  
  // 4. Testar inserção de receita
  console.log('\n4️⃣ Testando inserção de receita...')
  const testRevenue = {
    month: 10,
    date: '2025-10-14',
    invoice_number: 'TEST-001',
    client: 'Teste Client Admin',
    type: 'Desenvolvimento',
    due_date: '2025-11-14',
    amount: 1000,
    tax_percentage: 10,
    notes: 'Teste debug',
    tenant_id: clientAdmin.company_id
  }
  
  console.log('Dados para inserção:', testRevenue)
  
  const { data: insertedRevenue, error: insertError } = await supabase
    .from('revenue_entries')
    .insert([testRevenue])
    .select()
    .single()
  
  console.log('Receita inserida:', insertedRevenue)
  console.log('Erro na inserção:', insertError)
  
  if (insertError) {
    console.error('❌ Erro ao inserir receita:', insertError)
  } else {
    console.log('✅ Receita inserida com sucesso!')
    
    // Limpar o teste
    await supabase
      .from('revenue_entries')
      .delete()
      .eq('id', insertedRevenue.id)
    console.log('🧹 Receita de teste removida')
  }
}

debugClientAdmin().catch(console.error)
