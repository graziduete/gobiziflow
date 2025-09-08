"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { StatsCard } from "@/components/admin/stats-card"
import { ModernDateFilter } from "@/components/admin/modern-date-filter"
import { ModernGanttFilters } from "@/components/admin/modern-gantt-filters"
import { GanttView } from "@/components/admin/gantt-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, FolderKanban, TrendingUp, Clock, CheckCircle, AlertTriangle, Package, Eye, EyeOff } from "lucide-react"
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
  const [filters, setFilters] = useState<any>({})
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
  
  // Estados para controle de privacidade dos cards
  const [isRevenueVisible, setIsRevenueVisible] = useState(true)
  const [isForecastVisible, setIsForecastVisible] = useState(true)

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
      'delayed': 'Atrasado'
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
  }, [projects, selectedMonth, selectedYear, selectedCompany, filters])

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

          // Inclusão adicional: quando status filtrado for "completed", aceitar projetos com end_date <= fim do mês
          let includeByCompleted = false
          if (filters.status === 'completed' && hasEnd) {
            const e = new Date(project.end_date)
            includeByCompleted = e <= endOfMonth
          }

          return includeByMonth || includeByCompleted
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

        // Inclusão adicional para concluídos
        let includeByCompleted = false
        if (filters.status === 'completed' && hasEnd) {
          const e = new Date(project.end_date)
          includeByCompleted = e <= endOfMonth
        }

        return includeByMonth || includeByCompleted
      })
    }

    // Aplicar filtros adicionais do Gantt
    if (filters.search && filters.search.trim() !== '') {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.company && filters.company !== 'all') {
      filtered = filtered.filter((project) => project.company_id === filters.company)
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((project) => project.project_type === filters.type)
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((project) => project.status === filters.status)
    }

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

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
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
  
  // Total de projetos - considerar se é empresa específica ou todas as empresas
  const totalProjectsCount = selectedCompany !== "all" 
    ? filteredProjects.length 
    : projects.length
  
  // Projetos filtrados por empresa E período (para estatísticas detalhadas)
  const projectsCount = selectedCompany !== "all" 
    ? filteredProjects.length 
    : projects.length

  // Projetos por status - considerar se é empresa específica ou todas as empresas
  const projectsDelayed = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status === "delayed",
  ).length

  const projectsCompleted = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status === "completed"
  ).length

  const projectsInProgress = (selectedCompany !== "all" ? filteredProjects : projects).filter(
    (p) => p.status && !["completed", "cancelled", "planning"].includes(p.status),
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

  // Cálculo do faturamento total (soma de todos os orçamentos)
  const totalRevenue = selectedCompany !== "all" 
    ? filteredProjects.reduce((sum, p) => {
        const budget = p.budget || 0
        console.log(`💰 Projeto: ${p.name}, Orçamento: ${budget}, Tipo: ${typeof budget}`)
        return sum + budget
      }, 0)
    : projects.reduce((sum, p) => {
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
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">Visão geral completa do sistema de gerenciamento de projetos</p>
        </div>
        
        {/* Filtros - Acima dos cards para filtrar os dados */}
        <ModernDateFilter 
          onDateChange={handleDateChange} 
          onCompanyChange={setSelectedCompany}
          companies={companies}
          selectedCompany={selectedCompany}
        />
        
        {/* Cards de Resumo do Sistema - Dados filtrados */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-green-600">
                      {selectedCompany !== "all" ? "Faturamento da Empresa" : "Faturamento Total"}
                    </p>
                    <button
                      onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                      className="text-green-500 hover:text-green-700 transition-colors"
                      title={isRevenueVisible ? "Esconder dados" : "Mostrar dados"}
                    >
                      {isRevenueVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {isRevenueVisible 
                      ? `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "••••••••"
                    }
                  </p>
                  {selectedCompany !== "all" && (
                    <p className="text-xs text-green-500 mt-1">
                      {companies.find(c => c.id === selectedCompany)?.name}
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-blue-600">
                      {selectedCompany !== "all" ? "Projetos da Empresa" : "Previsto para este mês"}
                    </p>
                    <button
                      onClick={() => setIsForecastVisible(!isForecastVisible)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title={isForecastVisible ? "Esconder dados" : "Mostrar dados"}
                    >
                      {isForecastVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    {selectedCompany === "all" && expectedValueData.breakdown.length > 0 && (
                      <button
                        onClick={() => setShowForecastDetails(!showForecastDetails)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Ver detalhes da previsão"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedCompany !== "all" 
                      ? (isForecastVisible ? totalProjectsCount : "••••")
                      : (isForecastVisible 
                          ? `R$ ${((expectedValueData.breakdown || []).reduce((sum, item) => sum + (item.expectedValue || 0), 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "••••••••"
                        )
                    }
                  </p>
                  {selectedCompany !== "all" && (
                    <p className="text-xs text-blue-500 mt-1">
                      {companies.find(c => c.id === selectedCompany)?.name}
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              {/* Detalhes da Previsão (expandível) */}
              {selectedCompany === "all" && showForecastDetails && isForecastVisible && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    📊 Detalhamento da Previsão - {selectedYear}-{String(selectedMonth).padStart(2, '0')}
                  </h4>
                  
                  {expectedValueData.breakdown.length > 0 ? (
                    <div className="space-y-2">
                      {expectedValueData.breakdown.map((item, index) => {
                        const itemWithOptional = item as typeof item & { projectName?: string; projectStatus?: string; percentage?: number }
                        return (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex-1">
                              {itemWithOptional.projectName ? (
                                <>
                                  <span className="font-medium text-blue-700">{itemWithOptional.projectName}</span>
                                  <span className="text-blue-600 ml-2">• {item.companyName}</span>
                                  <div className="text-xs text-blue-500 mt-1">
                                    Status: {itemWithOptional.projectStatus === 'planning' ? 'Planejamento' : 
                                            itemWithOptional.projectStatus === 'homologation' ? 'Homologação' : 
                                            itemWithOptional.projectStatus === 'completed' ? 'Concluído' : 
                                            itemWithOptional.projectStatus}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <div>
                                    <span className="font-medium text-blue-700">{item.companyName}</span>
                                    <span className="text-blue-600 ml-2">• {item.metricType}</span>
                                  </div>
                                  {item.details && (
                                    <div className="text-xs text-blue-600 mt-1">{item.details}</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {itemWithOptional.percentage && (
                                <div className="text-xs text-blue-600 mb-1">
                                  {itemWithOptional.percentage}% da fase
                                </div>
                              )}
                              <span className="text-blue-700 font-medium">
                                R$ {(item.expectedValue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                      <div className="border-t border-blue-300 pt-2 mt-2">
                        <div className="flex items-center justify-between text-sm font-medium text-blue-800">
                          <span>Total Previsto:</span>
                          <span>
                            {`R$ ${((expectedValueData.breakdown || []).reduce((sum, item) => sum + (item.expectedValue || 0), 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600">
                      Nenhuma métrica configurada para este período
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    {selectedCompany !== "all" ? "Usuários da Empresa" : "Total de Usuários"}
                  </p>
                  <p className="text-2xl font-bold text-purple-700">{usersCount}</p>
                  {selectedCompany !== "all" && (
                    <p className="text-xs text-purple-500 mt-1">
                      {companies.find(c => c.id === selectedCompany)?.name}
                    </p>
                  )}
                </div>
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <FolderKanban className="w-8 h-8 text-purple-600" />
                </div>
              </div>
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
          value={selectedCompany !== "all" 
            ? filteredProjects.filter(p => p.status === "in_progress").length
            : projectsInProgress
          }
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
        <div>
          <h3 className="text-xl font-semibold">Visão Geral dos Cronogramas</h3>
          <p className="text-sm text-muted-foreground">Timeline e progresso dos projetos</p>
        </div>

        <ModernGanttFilters companies={companies} onFiltersChange={handleFiltersChange} />

        <GanttView projects={filteredProjects} allProjects={projects} companies={companies} selectedMonth={selectedMonth} selectedYear={selectedYear} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>Últimos projetos do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.companies?.name} • {translateProjectType(project.project_type || "Não definido")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{translateStatus(project.status || "planning")}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.budget ? `R$ ${Number(project.budget).toLocaleString("pt-BR")}` : "Sem orçamento"}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentProjects || recentProjects.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto encontrado no período</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
            <CardDescription>Estatísticas do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total de Usuários</span>
                <span className="text-sm text-muted-foreground">{usersCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Empresas Ativas</span>
                <span className="text-sm text-muted-foreground">{companiesCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Horas Restantes</span>
                <span className="text-sm text-muted-foreground">{totalContractedHours - totalConsumedHours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
