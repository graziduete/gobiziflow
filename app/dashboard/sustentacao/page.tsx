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

        console.log('🔍 Profile data:', { profile, profileError })

        if (profileError) {
          console.error('❌ Erro ao buscar perfil:', profileError)
          // Se erro ao buscar perfil, mostrar erro
          setLoading(false)
          return
        }

        if (!profile?.company_id) {
          console.log('⚠️ Usuário não tem company_id configurado')
          // Se não tem company_id, mostrar mensagem
          setLoading(false)
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <div className="text-yellow-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Empresa não configurada</h3>
            <p className="text-yellow-700 mb-4">
              Seu perfil não está associado a uma empresa. Entre em contato com o administrador para configurar sua empresa.
            </p>
            <button 
              onClick={() => router.push('/dashboard/profile')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Ir para Perfil
            </button>
          </div>
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