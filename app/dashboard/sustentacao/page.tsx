'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SustentacaoDashboard } from '@/components/sustentacao/dashboard'

export default function ClientSustentacaoPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUserData() {
      try {
        // Buscar dados do usuário logado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Buscar company_id do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (profileError || !profile?.company_id) {
          // Se não tem company_id, redirecionar para perfil para configurar
          router.push('/dashboard/profile')
          return
        }

        setCompanyId(profile.company_id)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error)
        router.push('/dashboard/profile')
      }
    }

    loadUserData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de sustentação...</p>
        </div>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados da empresa</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Sustentação</h1>
      </div>
      
      <SustentacaoDashboard 
        companyId={companyId}
        isClientView={true}
      />
    </div>
  )
}