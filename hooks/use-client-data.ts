import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  project_type: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  estimated_hours: number | null
  created_at: string
  company_id: string
}

interface Company {
  id: string
  name: string
  logo_url: string | null
  has_hour_package: boolean
  contracted_hours: number | null
}

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  companies: Company
}

interface ClientData {
  projects: Project[]
  company: Company | null
  userCompanies: UserCompany[]
  isLoading: boolean
  error: string | null
}

// Cache global para evitar múltiplas consultas
let globalCache: {
  data: ClientData | null
  timestamp: number
  userId: string | null
} = {
  data: null,
  timestamp: 0,
  userId: null
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useClientData() {
  const [data, setData] = useState<ClientData>({
    projects: [],
    company: null,
    userCompanies: [],
    isLoading: true,
    error: null
  })
  const [isMounted, setIsMounted] = useState(false)

  const router = useRouter()

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      const supabase = createClient()
      
      // Verificar cache
      const now = Date.now()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Verificar se o cache é válido
      if (!forceRefresh && 
          globalCache.data && 
          globalCache.userId === user.id && 
          (now - globalCache.timestamp) < CACHE_DURATION) {
        console.log('🚀 [useClientData] Using cached data')
        setData({
          ...globalCache.data,
          isLoading: false
        })
        return
      }

      console.log('🔄 [useClientData] Fetching fresh data')
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      // Primeiro buscar empresas do usuário
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from("user_companies")
        .select(`
          id,
          user_id,
          company_id,
          companies (
            id,
            name,
            logo_url,
            has_hour_package,
            contracted_hours
          )
        `)
        .eq("user_id", user.id)

      if (userCompaniesError) throw userCompaniesError

      // Depois buscar projetos da empresa
      const companyId = userCompanies?.[0]?.company_id
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          priority,
          project_type,
          start_date,
          end_date,
          estimated_hours,
          budget,
          created_at,
          company_id
        `)
        .eq("company_id", companyId || '')
        .order("created_at", { ascending: false })

      if (projectsError) throw projectsError

      const company = userCompanies?.[0]?.companies || null

      const newData: ClientData = {
        projects,
        company,
        userCompanies,
        isLoading: false,
        error: null
      }

      // Atualizar cache
      globalCache = {
        data: newData,
        timestamp: now,
        userId: user.id
      }

      setData(newData)
    } catch (error) {
      console.error('❌ [useClientData] Error:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
    }
  }, [router])

  const refreshData = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  // Evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchData()
    }
  }, [fetchData, isMounted])

  // Memoizar dados calculados
  const stats = useMemo(() => {
    if (!data.projects.length) return {
      totalProjects: 0,
      projectsInPlanning: 0,
      projectsInProgress: 0,
      projectsDelayed: 0,
      projectsCompleted: 0
    }

    return {
      totalProjects: data.projects.length,
      projectsInPlanning: data.projects.filter(p => p.status === 'planning').length,
      projectsInProgress: data.projects.filter(p => p.status === 'in_progress').length,
      projectsDelayed: data.projects.filter(p => p.status === 'delayed').length,
      projectsCompleted: data.projects.filter(p => p.status === 'completed').length
    }
  }, [data.projects])

  return {
    ...data,
    stats,
    refreshData
  }
}