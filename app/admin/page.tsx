"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { StatsCard } from "@/components/admin/stats-card"
import { ModernDateFilter } from "@/components/admin/modern-date-filter"
import { GanttView } from "@/components/admin/gantt-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, FolderKanban, TrendingUp, Clock, CheckCircle, AlertTriangle, Package, Eye, EyeOff, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { HourService } from "@/lib/hour-service"
// ForecastService REMOVIDO - Agora usa apenas payment_metrics
import { DashboardService } from "@/lib/dashboard-service"
import { CompanyHourStats } from "@/lib/types"

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [userCompanies, setUserCompanies] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [hourStats, setHourStats] = useState<CompanyHourStats[]>([])
  // monthlyForecast REMOVIDA - Agora usa apenas payment_metrics
  const [showForecastDetails, setShowForecastDetails] = useState(false)
  const [dashboardHourStats, setDashboardHourStats] = useState({
    totalContractedHours: 0,
    totalConsumedHours: 0,
    totalRemainingHours: 0,
    companiesWithPackages: 0
  })
  const [expectedValueData, setExpectedValueData] = useState<{
    totalExpected: number
    breakdown: Array<{
      companyId: string
      companyName: string
      metricType: string
      expectedValue: number
      details: string
    }>
  }>({
    totalExpected: 0,
    breakdown: []
  })
  
  // Estado para o role do usuário
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Estados para controle de privacidade dos cards
  const [isRevenueVisible, setIsRevenueVisible] = useState(false)
  const [isForecastVisible, setIsForecastVisible] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Função para traduzir status dos projetos
  const translateStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': 'Planejamento',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'on_hold': 'Pausado',
      'delayed': 'Atrasado',
      'commercial_proposal': 'Proposta Comercial'
    }
    return statusMap[status] || status
  }

  const translateProjectType = (projectType: string) => {
    const typeMap: { [key: string]: string } = {
      automation: "Automação de Processos (RPA ou Script de Automação)",
      data_analytics: "Data & Analytics",
      digital_development: "Desenvolvimento Digital (App / Web)",
      design: "Design",
      consulting: "Consultoria",
      project_management: "Gestão de Projetos/PMO",
      system_integration: "Integração de Sistemas / APIs",
      infrastructure: "Infraestrutura/Cloud",
      support: "Suporte / Sustentação",
      training: "Treinamento / Capacitação"
    }
    return typeMap[projectType] || projectType
  }

  useEffect(() => {
    fetchData()
    
    // Buscar role do usuário
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }
    getUserRole()
    
    // Refresh quando a página volta a ter foco (usuário volta da criação de empresa)
    const handleFocus = () => {
      console.log('🔄 Página em foco - atualizando dados...')
      fetchData()
    }
    
    // Refresh quando a visibilidade da página muda (usuário volta da criação de empresa)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página visível - atualizando dados...')
        fetchData()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const runFilters = async () => {
      await applyFilters()
      await loadExpectedValue()
    }
    runFilters()
  }, [projects, selectedMonth, selectedYear, selectedCompany])

  const fetchData = async () => {
    try {
      console.log("🔄 Iniciando busca de dados...")
      
      const [companiesResult, usersResult, userCompaniesResult, projectsResult] = await Promise.all([
      supabase.from("companies").select("*"),
      supabase.from("profiles").select("*"),
        supabase.from("user_companies").select("*"),
      supabase.from("projects").select(`
        *,
          companies(name, has_hour_package, contracted_hours)
      `),
    ])

      if (companiesResult.error) {
        console.error("❌ Erro ao buscar empresas:", companiesResult.error)
      }
      if (usersResult.error) {
        console.error("❌ Erro ao buscar usuários:", usersResult.error)
      }
      if (userCompaniesResult.error) {
        console.error("❌ Erro ao buscar associações usuário-empresa:", userCompaniesResult.error)
      }
      if (projectsResult.error) {
        console.error("❌ Erro ao buscar projetos:", projectsResult.error)
      }

      const companiesData = companiesResult.data || []
      const usersData = usersResult.data || []
      const userCompaniesData = userCompaniesResult.data || []
      const projectsData = projectsResult.data || []

      console.log("📊 Dados carregados:")
      console.log("- Empresas:", companiesData.length)
      console.log("- Usuários:", usersData.length)
      console.log("- Projetos:", projectsData.length)
      
      if (projectsData.length > 0) {
        console.log("💰 Primeiro projeto:", {
          name: projectsData[0].name,
          budget: projectsData[0].budget,
          budgetType: typeof projectsData[0].budget
        })
      }

      setCompanies(companiesData)
      setUsers(usersData)
      setUserCompanies(userCompaniesData)
      setProjects(projectsData)
      
      // Buscar estatísticas de horas após carregar empresas
      await fetchHourStats(companiesData)
    } catch (error) {
      console.error("💥 Erro geral na busca de dados:", error)
    }
  }

  // fetchMonthlyForecast REMOVIDA - Agora usa apenas payment_metrics

  // Nova função para buscar estatísticas de horas
  const fetchHourStats = async (companiesData: any[]) => {
    try {
      console.log("🔄 Buscando estatísticas de horas...")
      console.log("📊 Parâmetros:", {
        selectedCompany,
        selectedMonth,
        selectedYear,
        companiesCount: companiesData.length
      })
      
      // Buscar estatísticas consolidadas do dashboard
      const dashboardStats = await HourService.getDashboardHourStats(
        selectedCompany !== "all" ? selectedCompany : undefined,
        selectedMonth ? selectedMonth.toString() : undefined,
        selectedYear.toString()
      )
      
      console.log("📈 Dashboard stats retornadas:", dashboardStats)
      setDashboardHourStats(dashboardStats)
      
      // Buscar estatísticas detalhadas por empresa (APENAS se empresa específica selecionada)
      if (selectedCompany !== "all") {
        console.log("🏢 Buscando estatísticas detalhadas para empresa:", selectedCompany)
        
        const companyData = await HourService.getCompanyHourData(selectedCompany)
        
        if (companyData && companyData.has_hour_package) {
          const company = companiesData.find(c => c.id === selectedCompany)
          const companyStats = {
            company_id: selectedCompany,
            company_name: company?.name || 'Empresa',
            month_year: selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}` : '',
            contracted_hours: companyData.contracted_hours,
            consumed_hours: 0, // Será calculado automaticamente
            previous_months_remaining: 0,
            total_available: companyData.contracted_hours,
            remaining_hours: companyData.contracted_hours,
            account_model: companyData.account_model as "standard" | "current_account",
            package_type: companyData.package_type as "monthly" | "period",
            is_active: true,
            start_date: companyData.package_start_date,
            end_date: companyData.package_end_date
          }
          
          console.log("📊 Estatísticas detalhadas da empresa:", companyStats)
          console.log("🔍 Debug das datas:", {
            package_start_date: companyData.package_start_date,
            package_end_date: companyData.package_end_date,
            start_date: companyStats.start_date,
            end_date: companyStats.end_date
          })
          setHourStats([companyStats])
        } else {
          setHourStats([])
        }
      } else {
        // Se "todas as empresas" selecionado, NÃO mostrar estatísticas detalhadas
        setHourStats([])
      }
      
      console.log("✅ Estatísticas de horas carregadas:", {
        dashboard: dashboardStats,
        companies: hourStats.length,
        selectedCompany: selectedCompany
      })
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas de horas:", error)
    }
  }



  const loadExpectedValue = async () => {
    try {
      if (selectedCompany === "all") {
        // Para todas as empresas, calcular baseado nas métricas
        const monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
        console.log('🔄 Calculando valor esperado para:', monthYear)
        
        const result = await DashboardService.getExpectedValueForMonth(monthYear)
        
        setExpectedValueData(result)
        console.log('📊 Valor esperado calculado:', result)
        console.log('📊 Total esperado:', result.totalExpected)
        console.log('📊 Breakdown length:', result.breakdown.length)
      } else {
        // Para empresa específica, usar lógica atual (projetos)
        setExpectedValueData({
          totalExpected: 0,
          breakdown: []
        })
      }
    } catch (error) {
      console.error('❌ Erro ao calcular valor esperado:', error)
      setExpectedValueData({
        totalExpected: 0,
        breakdown: []
      })
    }
  }

  // Função para verificar se um projeto está dentro do período contratado da empresa
  const isProjectWithinContractPeriod = async (project: any) => {
    if (selectedCompany === "all") return true
    
    try {
      const companyData = await HourService.getCompanyHourData(selectedCompany)
      if (!companyData || !companyData.has_hour_package) return true
      
      // Se é pacote mensal, sempre válido
      if (companyData.package_type === 'monthly') return true
      
      // Se é pacote por período, verificar se o projeto está dentro do período
      if (project.created_at) {
        const projectDate = new Date(project.created_at)
        const startDate = new Date(companyData.package_start_date)
        const endDate = companyData.package_end_date ? new Date(companyData.package_end_date) : null
        
        return projectDate >= startDate && (endDate ? projectDate <= endDate : true)
      }
      
      return true
    } catch (error) {
      console.error('Erro ao verificar período do projeto:', error)
      return true
    }
  }

  const applyFilters = async () => {
    let filtered = [...projects]

    // Filtro por empresa
    if (selectedCompany !== "all") {
      filtered = filtered.filter((project) => project.company_id === selectedCompany)
    }

    // Filtro por período - considerar período contratado da empresa
    if (selectedCompany !== "all") {
      console.log("🏢 Aplicando filtro para empresa específica:", selectedCompany)
      
      // Para empresa específica, verificar período contratado
      const companyData = await HourService.getCompanyHourData(selectedCompany)
      console.log("📊 Dados da empresa para filtro:", companyData)
      
      if (companyData && companyData.has_hour_package && companyData.package_type === 'period') {
        console.log("📅 Usando filtro por período contratado (period)")
        console.log("📅 Período contratado:", {
          start: companyData.package_start_date,
          end: companyData.package_end_date
        })
        
        // Verificar se o mês/ano selecionado está dentro do período contratado
        const selectedDate = new Date(selectedYear, (selectedMonth || 1) - 1, 1)
        const startDate = new Date(companyData.package_start_date)
        const endDate = companyData.package_end_date ? new Date(companyData.package_end_date) : null
        
        const isSelectedPeriodWithinContract = selectedDate >= startDate && (endDate ? selectedDate <= endDate : true)
        console.log("🔍 Período selecionado está dentro do contrato:", isSelectedPeriodWithinContract)
        
        if (isSelectedPeriodWithinContract) {
          // Se estamos dentro do período contratado, mostrar TODOS os projetos da empresa
          console.log("✅ Dentro do período contratado - mostrando todos os projetos da empresa")
          // Não aplicar filtro de data, manter apenas o filtro de empresa
        } else {
          // Se estamos fora do período contratado, não mostrar projetos
          console.log("❌ Fora do período contratado - não mostrando projetos")
          filtered = []
        }
        
        console.log(`📊 Projetos após filtro de período contratado: ${filtered.length}`)
      } else {
        console.log("📅 Usando filtro por interseção de período do projeto com mês/ano selecionado")
        const startOfMonth = new Date(selectedYear, (selectedMonth || 1) - 1, 1)
        const endOfMonth = new Date(selectedYear, (selectedMonth || 1), 0)
        // Mostrar projetos ativos no mês OU (se filtro status = concluído) concluídos até o fim do mês
        filtered = filtered.filter((project) => {
          const hasStart = !!project.start_date && !isNaN(new Date(project.start_date).getTime())
          const hasEnd = !!project.end_date && !isNaN(new Date(project.end_date).getTime())
          let includeByMonth = false
          if (hasStart && hasEnd) {
            const s = new Date(project.start_date)
            const e = new Date(project.end_date)
            includeByMonth = s <= endOfMonth && e >= startOfMonth
          } else if (project.created_at) {
            // Fallback para projetos antigos: usar created_at
            const d = new Date(project.created_at)
            if (!isNaN(d.getTime())) {
              includeByMonth = (selectedMonth === null)
                ? d.getFullYear() === selectedYear
                : (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear)
            }
          }

          return includeByMonth
        })
      }
    } else {
      // Para "todas as empresas", considerar interseção com o mês/ano selecionado
      const startOfMonth = new Date(selectedYear, (selectedMonth || 1) - 1, 1)
      const endOfMonth = new Date(selectedYear, (selectedMonth || 1), 0)
      filtered = filtered.filter((project) => {
        const hasStart = !!project.start_date && !isNaN(new Date(project.start_date).getTime())
        const hasEnd = !!project.end_date && !isNaN(new Date(project.end_date).getTime())
        let includeByMonth = false
        if (hasStart && hasEnd) {
          const s = new Date(project.start_date)
          const e = new Date(project.end_date)
          includeByMonth = s <= endOfMonth && e >= startOfMonth
        } else if (project.created_at) {
          const d = new Date(project.created_at)
          if (!isNaN(d.getTime())) {
            includeByMonth = (selectedMonth === null)
              ? d.getFullYear() === selectedYear
              : (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear)
          }
        }

        return includeByMonth
      })
    }

    // Ordenar por data de início ascendente (nulos por último)
    filtered.sort((a, b) => {
      const ad = a?.start_date ? new Date(a.start_date).getTime() : Infinity
      const bd = b?.start_date ? new Date(b.start_date).getTime() : Infinity
      return ad - bd
    })
    setFilteredProjects(filtered)
    
    // Buscar estatísticas de horas atualizadas quando os filtros mudarem
    if (companies.length > 0) {
      fetchHourStats(companies)
    }
  }

  const handleDateChange = (month: number | null, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    
    // Buscar estatísticas de horas atualizadas quando a data mudar
    if (companies.length > 0) {
      fetchHourStats(companies)
    }
  }


  // Contagem de empresas e usuários (filtrado por empresa selecionada)
  const companiesForCount = selectedCompany !== "all" 
    ? companies.filter(c => c.id === selectedCompany)
    : companies
  
  // Para usuários, sempre mostrar todos os usuários da empresa (sem lógica de período)
  const usersForCount = selectedCompany !== "all" 
    ? userCompanies.filter(uc => uc.company_id === selectedCompany)
    : userCompanies // Para "todas as empresas", mostrar todos os usuários
  
  const companiesCount = companiesForCount.length
  const usersCount = usersForCount.length

  // Debug: verificar contagens
  console.log('🏢 Empresas para contagem:', companiesForCount.length)
  console.log('👥 Usuários para contagem:', usersForCount.length)
  console.log('👥 Total de usuários no sistema:', users.length)
  console.log('👥 Total de associações usuário-empresa:', userCompanies.length)
  console.log('👥 Associações da empresa selecionada:', userCompanies.filter(uc => uc.company_id === selectedCompany))
  
  // Total de projetos - considerar se é empresa específica ou todas as empresas (excluindo cancelados e propostas comerciais)
  const totalProjectsCount = selectedCompany !== "all" 
    ? filteredProjects.filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal").length 
    : projects.filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal").length
  
  // Projetos filtrados por empresa E período (para estatísticas detalhadas, excluindo cancelados e propostas comerciais)
  const projectsCount = selectedCompany !== "all" 
    ? filteredProjects.filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal").length 
    : projects.filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal").length

  // Projetos por status - considerar se é empresa específica ou todas as empresas
  const projectsDelayed = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status === "delayed",
  ).length

  const projectsCompleted = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status === "completed"
  ).length

  const projectsInProgress = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status === "in_progress",
  ).length

  // Debug: verificar projetos por status
  console.log('📊 Projetos filtrados por período:', filteredProjects.length)
  console.log('📊 Total de projetos da empresa:', projects.filter(p => p.company_id === selectedCompany).length)
  console.log('🔍 Projetos por status:', filteredProjects.map(p => ({ 
    name: p.name, 
    status: p.status,
    company_id: p.company_id
  })))
  console.log('🚀 Projetos em andamento (excluindo planning):', projectsInProgress)
  console.log('⏸️ Projetos em planejamento:', filteredProjects.filter(p => p.status === "planning").length)
  console.log('⚠️ Projetos atrasados:', projectsDelayed)
  console.log('✅ Projetos concluídos:', projectsCompleted)

  // Cálculo de horas baseado no HourService (mais preciso e com lógica de conta corrente)
  // Sempre usar dashboardHourStats que já inclui pacotes + projetos sem pacote
  const totalContractedHours = dashboardHourStats.totalContractedHours
  
  const totalConsumedHours = dashboardHourStats.totalConsumedHours
  const totalRemainingHours = totalContractedHours - totalConsumedHours

  // Debug: verificar horas do HourService
  console.log('🏢 Estatísticas de horas do HourService:', dashboardHourStats)
  console.log('⏰ Total de horas contratadas:', totalContractedHours)
  console.log('🔥 Horas consumidas:', totalConsumedHours)
  console.log('⏳ Horas restantes:', totalRemainingHours)

  // Cálculo do faturamento total (soma de todos os orçamentos, excluindo cancelados e propostas comerciais)
  const totalRevenue = selectedCompany !== "all" 
    ? filteredProjects
        .filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal")
        .reduce((sum, p) => {
          const budget = p.budget || 0
          console.log(`💰 Projeto: ${p.name}, Status: ${p.status}, Orçamento: ${budget}, Tipo: ${typeof budget}`)
          return sum + budget
        }, 0)
    : projects
        .filter(p => p.status !== "cancelled" && p.status !== "commercial_proposal")
        .reduce((sum, p) => {
          const budget = p.budget || 0
          return sum + budget
        }, 0)

  // LÓGICA ANTIGA REMOVIDA - Agora usa apenas payment_metrics
  
  // Debug: verificar projetos e orçamentos
  console.log('💰 Total de faturamento:', totalRevenue)
  // monthlyForecast REMOVIDA - Agora usa apenas payment_metrics
  console.log('📁 Todos os projetos:', projects.length)
  console.log('🔍 Projetos filtrados por período:', filteredProjects.length)
  console.log('📊 Total de projetos (filtrado por empresa e período):', totalProjectsCount)
  
  // Debug: verificar cálculo do previsto (NOVA LÓGICA)
  if (selectedCompany === "all") {
    console.log('📊 NOVA LÓGICA - Usando payment_metrics:')
    console.log('📊 Total esperado:', expectedValueData.totalExpected)
    console.log('📊 Breakdown:', expectedValueData.breakdown)
  }

  const recentProjects = filteredProjects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 relative">
      {/* Fundo decorativo com gradiente animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="space-y-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Dashboard Administrativo
        </h2>
        <p className="text-slate-600 text-base">Visão geral completa do sistema de gerenciamento de projetos</p>
      </div>

        {/* Filtros - Acima dos cards para filtrar os dados */}
        <ModernDateFilter 
          onDateChange={handleDateChange} 
          onCompanyChange={setSelectedCompany}
          companies={companies}
          selectedCompany={selectedCompany}
        />
        
        {/* Cards de Resumo do Sistema - Dados filtrados */}
        {/* Esconder cards financeiros para admin_operacional */}
        <div className={`grid gap-4 md:grid-cols-3 ${userRole === null ? 'opacity-0' : userRole === "admin_operacional" ? 'hidden' : 'opacity-100'}`}>
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-green-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            {/* Fundo decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-500" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                    {selectedCompany !== "all" ? "Faturamento da Empresa" : "Faturamento Total"}
                  </h3>
                  <button
                    onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                    className="p-1.5 rounded-lg bg-green-100/50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all hover:scale-110"
                    title={isRevenueVisible ? "Esconder dados" : "Mostrar dados"}
                  >
                    {isRevenueVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300 group-hover:scale-110">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                {isRevenueVisible 
                  ? `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "••••••••"
                }
              </p>
              {selectedCompany !== "all" && (
                <p className="text-xs text-green-600/70 font-medium">
                  {companies.find(c => c.id === selectedCompany)?.name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            {/* Fundo decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-500" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                    {selectedCompany !== "all" ? "Projetos da Empresa" : "Previsto para este mês"}
                  </h3>
                  <button
                    onClick={() => setIsForecastVisible(!isForecastVisible)}
                    className="p-1.5 rounded-lg bg-blue-100/50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110"
                    title={isForecastVisible ? "Esconder dados" : "Mostrar dados"}
                  >
                    {isForecastVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {selectedCompany === "all" && expectedValueData.breakdown.length > 0 && (
                    <button
                      onClick={() => setShowForecastDetails(!showForecastDetails)}
                      className="p-1.5 rounded-lg bg-blue-100/50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110"
                      title="Ver detalhes da previsão"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300 group-hover:scale-110">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                {selectedCompany !== "all" 
                  ? (isForecastVisible ? totalProjectsCount : "••••")
                  : (isForecastVisible 
                      ? `R$ ${((expectedValueData.breakdown || []).reduce((sum, item) => sum + (item.expectedValue || 0), 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "••••••••"
                    )
                }
              </p>
              {selectedCompany !== "all" && (
                <p className="text-xs text-blue-600/70 font-medium">
                  {companies.find(c => c.id === selectedCompany)?.name}
                </p>
              )}
              
              {/* Detalhes da Previsão (expandível) */}
              {selectedCompany === "all" && showForecastDetails && isForecastVisible && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-xl border border-blue-200/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-600 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Detalhamento da Previsão - {selectedYear}-{String(selectedMonth).padStart(2, '0')}
                    </h4>
                  </div>
                  
                  {expectedValueData.breakdown.length > 0 ? (
                    <div className="space-y-2.5">
                      {expectedValueData.breakdown.map((item, index) => {
                        const itemWithOptional = item as typeof item & { projectName?: string; projectStatus?: string; percentage?: number }
                        return (
                          <div key={index} className="p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 group/item">
                            <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {itemWithOptional.projectName ? (
                                <div className="space-y-1">
                                  <div className="font-semibold text-slate-800 text-sm group-hover/item:text-blue-700 transition-colors truncate">
                                    {itemWithOptional.projectName}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                      {item.companyName}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                                      {itemWithOptional.projectStatus === 'planning' ? 'Planejamento' : 
                                       itemWithOptional.projectStatus === 'homologation' ? 'Homologação' : 
                                       itemWithOptional.projectStatus === 'completed' ? 'Concluído' : 
                                       itemWithOptional.projectStatus === 'in_progress' ? 'Em Andamento' :
                                       itemWithOptional.projectStatus}
                                    </span>
                                    {itemWithOptional.percentage && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                                        {itemWithOptional.percentage}% concluído
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-semibold text-slate-800 text-sm group-hover/item:text-blue-700 transition-colors">
                                    {item.companyName}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                      {item.metricType}
                                    </span>
                                  </div>
                                  {item.details && (
                                    <div className="text-xs text-slate-500 mt-1">{item.details}</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                                R$ {(item.expectedValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="mt-3 pt-3 border-t-2 border-blue-200">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-md">
                          <span className="text-sm font-bold text-white">Total Previsto:</span>
                          <span className="text-lg font-bold text-white">
                            R$ {((expectedValueData.breakdown || []).reduce((sum, item) => sum + (item.expectedValue || 0), 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nenhuma métrica configurada para este período
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-purple-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            {/* Fundo decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-2xl group-hover:from-purple-500/20 group-hover:to-indigo-500/20 transition-all duration-500" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {selectedCompany !== "all" ? "Usuários da Empresa" : "Total de Usuários"}
                </h3>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 group-hover:from-purple-500/20 group-hover:to-indigo-500/20 transition-all duration-300 group-hover:scale-110">
                  <FolderKanban className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                {usersCount}
              </p>
              {selectedCompany !== "all" && (
                <p className="text-xs text-purple-600/70 font-medium">
                  {companies.find(c => c.id === selectedCompany)?.name}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={selectedCompany !== "all" ? "Projetos em Planejamento" : "Total de Projetos"}
          value={selectedCompany !== "all" 
            ? (selectedCompany !== "all" ? filteredProjects : projects).filter(p => p.status === "planning").length
            : projectsCount
          }
          description={selectedCompany !== "all" ? "Aguardando início" : "Período selecionado"}
          icon={FolderKanban}
        />
        <StatsCard
          title="Projetos em Andamento"
          value={projectsInProgress}
          description="Em desenvolvimento"
          icon={FolderKanban}
        />
        <StatsCard
          title="Projetos Atrasados"
          value={selectedCompany !== "all" 
            ? filteredProjects.filter(p => p.status === "delayed").length
            : projectsDelayed
          }
          description="Requerem atenção"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Projetos Concluídos"
          value={selectedCompany !== "all" 
            ? filteredProjects.filter(p => p.status === "completed").length
            : projectsCompleted
          }
          description="Finalizados com sucesso"
          icon={CheckCircle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard 
          title="Total de Horas Contratadas" 
          value={totalContractedHours} 
          description="Horas" 
          icon={Clock} 
        />
        <StatsCard
          title="Total de Horas Consumidas"
          value={totalConsumedHours}
          description="Horas utilizadas"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total de Horas Restantes"
          value={totalRemainingHours}
          description="Horas disponíveis"
          icon={Clock}
        />
      </div>

      {/* Estatísticas Detalhadas de Horas (apenas quando empresa específica selecionada) */}
      {selectedCompany !== "all" && hourStats.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Configuração do Pacote - {companies.find(c => c.id === selectedCompany)?.name}
            </CardTitle>
            <CardDescription>
              Detalhes da configuração do pacote de horas
            </CardDescription>
          </CardHeader>
                      <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hourStats.map((stat, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Tipo de Pacote
                      </span>
                      <Badge variant={stat.package_type === 'monthly' ? 'default' : 'secondary'}>
                        {stat.package_type === 'monthly' ? 'Mensal' : 'Período'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Modelo de Conta
                      </span>
                      <Badge variant="outline">
                        {stat.account_model === 'current_account' ? 'Conta Corrente' : 'Padrão'}
                      </Badge>
                    </div>
                    {/* Datas do período */}
                    {stat.package_type === 'period' && stat.start_date && stat.end_date && (
                      <div className="col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Data de Início
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {(() => {
                              if (!stat.start_date) return 'N/A'
                              const date = new Date(stat.start_date + 'T00:00:00')
                              console.log('🔍 Dashboard - Data início:', { input: stat.start_date, output: date.toLocaleDateString('pt-BR') })
                              return date.toLocaleDateString('pt-BR')
                            })()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Data de Fim
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {(() => {
                              if (!stat.end_date) return 'N/A'
                              const date = new Date(stat.end_date + 'T00:00:00')
                              console.log('🔍 Dashboard - Data fim:', { input: stat.end_date, output: date.toLocaleDateString('pt-BR') })
                              return date.toLocaleDateString('pt-BR')
                            })()}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Para pacotes mensais, mostrar apenas o mês de início */}
                    {stat.package_type === 'monthly' && stat.start_date && (
                      <div className="col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Início do Pacote
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {(() => {
                              if (!stat.start_date) return 'N/A'
                              const date = new Date(stat.start_date + 'T00:00:00')
                              console.log('🔍 Dashboard - Data mensal:', { input: stat.start_date, output: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })
                              return date.toLocaleDateString('pt-BR', { 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            })()}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {stat.account_model === 'current_account' && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Modelo Conta Corrente:</strong> Horas não utilizadas acumulam para meses futuros
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <GanttView 
          projects={recentProjects} 
          allProjects={projects} 
          companies={companies} 
          selectedMonth={selectedMonth} 
          selectedYear={selectedYear}
          userRole={userRole}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 shadow-md hover:shadow-lg transition-all duration-300">
          {/* Círculo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-md">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Projetos Recentes
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600">Últimos projetos do período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                          {project.companies?.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {translateProjectType(project.project_type || "Não definido")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge 
                        className={`border-0 shadow-md font-bold px-3 py-1 text-xs ${
                          project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                          project.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                          project.status === 'delayed' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' :
                          project.status === 'planning' ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white' :
                          project.status === 'cancelled' ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white' :
                          project.status === 'commercial_proposal' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' :
                          'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                        }`}
                      >
                        {translateStatus(project.status || "planning")}
                      </Badge>
                      <span className="text-sm font-semibold text-green-700">
                        {project.budget ? `R$ ${Number(project.budget).toLocaleString("pt-BR")}` : "Sem orçamento"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!recentProjects || recentProjects.length === 0) && (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nenhum projeto encontrado no período
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-purple-50/30 shadow-md hover:shadow-lg transition-all duration-300">
          {/* Círculo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-full blur-2xl" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-md">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
                Visão Geral do Sistema
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600">Estatísticas do período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100 hover:border-purple-200 transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-50 rounded-md">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Total de Usuários</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">{usersCount}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100 hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Empresas Ativas</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">{companiesCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-100 hover:border-green-200 transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-green-50 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Horas Restantes</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{totalContractedHours - totalConsumedHours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
