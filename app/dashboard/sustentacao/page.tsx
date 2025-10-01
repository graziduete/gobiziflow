"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SustentacaoDashboard } from '@/components/sustentacao/dashboard';
import { CompanySelector } from '@/components/sustentacao/company-selector';
import { BarChart3, Sparkles, ArrowLeft } from "lucide-react";

export default function ClientSustentacaoPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        // Buscar dados do usuário logado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Buscar company_id do usuário através da tabela user_companies
        console.log('🔍 Buscando empresa do usuário:', user.id)
        
        const { data: userCompany, error: userCompanyError } = await supabase
          .from('user_companies')
          .select('company_id, companies(id, name)')
          .eq('user_id', user.id)
          .single()

        console.log('🔍 User company data:', { 
          userCompany, 
          userCompanyError,
          userEmail: user.email,
          userId: user.id
        })

        if (userCompanyError) {
          console.error('❌ Erro ao buscar empresa do usuário:', userCompanyError)
          setLoading(false)
          return
        }

        if (!userCompany?.company_id) {
          console.log('⚠️ Usuário não está associado a nenhuma empresa')
          setLoading(false)
          return
        }

        setUserCompanyId(userCompany.company_id)
        setSelectedCompanyId(userCompany.company_id) // Auto-selecionar a empresa do usuário
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error)
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const handleBackToSelector = () => {
    setSelectedCompanyId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {/* Animação de raio moderna */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Raio animado */}
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path 
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                className="animate-pulse"
                style={{
                  stroke: 'url(#lightning-gradient-client)',
                  strokeWidth: 0.5,
                  fill: 'url(#lightning-gradient-client)',
                  filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))'
                }}
              />
              <defs>
                <linearGradient id="lightning-gradient-client" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            {/* Círculo pulsante ao fundo */}
            <div className="absolute inset-0 -z-10 animate-ping opacity-20">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">Carregando dados de sustentação...</p>
          <p className="text-sm text-slate-500">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  if (!userCompanyId) {
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
    <div className="space-y-8 px-4 md:px-6">
      {!selectedCompanyId ? (
        <CompanySelector 
          onCompanySelect={handleCompanySelect}
          selectedCompanyId={userCompanyId}
          isClientView={true} // Nova prop para indicar que é visualização do cliente
          userCompanyId={userCompanyId} // Passar o ID da empresa do usuário para filtrar
        />
      ) : (
        <div className="space-y-6">
          {/* Header modernizado */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl -m-4"></div>
            <div className="relative bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToSelector}
                  className="absolute top-4 left-4 text-blue-600 hover:text-blue-700 text-lg font-medium p-1 rounded-md hover:bg-blue-50 transition-colors"
                  title="Voltar para seleção"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-4 ml-12">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                      Dashboard Sustentação
                    </h2>
                    <p className="text-slate-600 text-lg mt-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      Dashboard integrado com Google Sheets
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <SustentacaoDashboard 
            companyId={selectedCompanyId} 
            useV2={selectedCompanyId !== '443a6a0e-768f-48e4-a9ea-0cd972375a30'}
            isClientView={true}
          />
        </div>
      )}
    </div>
  );
}