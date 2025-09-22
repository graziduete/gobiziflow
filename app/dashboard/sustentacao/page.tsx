import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SustentacaoDashboard } from '@/components/sustentacao/dashboard'

export default async function ClientSustentacaoPage() {
  try {
    const supabase = await createClient()
    
    // Buscar dados do usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth/login')
    }

    // Buscar company_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      // Se não tem company_id, redirecionar para perfil para configurar
      redirect('/dashboard/profile')
    }

    // Buscar dados da empresa para passar para o dashboard
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', profile.company_id)
      .single()

    if (companyError || !company) {
      // Se empresa não existe, redirecionar para perfil
      redirect('/dashboard/profile')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Sustentação</h1>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados de sustentação...</p>
            </div>
          </div>
        }>
          <SustentacaoDashboard 
            companyId={profile.company_id}
            companyName={company.name}
            isClientView={true}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Erro ao carregar dados do cliente:', error)
    redirect('/dashboard/profile')
  }
}