"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Activity,
  PieChart,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Calendar
} from "lucide-react"
import { AnalyticsService, AnalyticsData } from "@/lib/analytics-service"
import { HourService } from "@/lib/hour-service"
import { formatDecimalToHHMM } from "@/lib/utils/hours"
import { useClientData } from "@/hooks/use-client-data"
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ID da Copersucar
const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30'

// Função utilitária para calcular período safra
function getSafraPeriod(safra: string): { start: string; end: string } | null {
  // Formato esperado: "2025/26" ou "2025/2026"
  const match = safra.match(/(\d{4})\/(\d{2,4})/)
  if (!match) return null
  
  const startYear = parseInt(match[1])
  const endYearShort = parseInt(match[2])
  // Se for 2 dígitos, assume que é o ano seguinte (ex: 26 = 2026)
  const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort
  
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`
  }
}

// Função para gerar lista de safras disponíveis
function getAvailableSafras(): string[] {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // Se estamos após abril, a safra atual já começou
  const startYear = currentMonth >= 4 ? currentYear : currentYear - 1
  const safras: string[] = []
  
  // Gerar safras dos últimos 3 anos e próximos 2 anos
  for (let i = -3; i <= 2; i++) {
    const year = startYear + i
    const nextYear = year + 1
    const nextYearShort = nextYear.toString().slice(-2)
    safras.push(`${year}/${nextYearShort}`)
  }
  
  return safras.reverse()
}

// Função para obter safra atual baseada na data
function getCurrentSafra(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // Se estamos entre abril e dezembro, a safra é do ano atual
  // Se estamos entre janeiro e março, a safra é do ano anterior
  if (month >= 4) {
    const nextYear = (year + 1).toString().slice(-2)
    return `${year}/${nextYear}`
  } else {
    const prevYear = year - 1
    const currentYearShort = year.toString().slice(-2)
    return `${prevYear}/${currentYearShort}`
  }
}

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function ClientAnalyticsPage() {
  const router = useRouter()
  const { company, isLoading: clientLoading } = useClientData()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number | string>>(new Set())
  const [hourStats, setHourStats] = useState({
    totalContractedHours: 0,
    totalConsumedHours: 0,
    totalRemainingHours: 0
  })
  
  // Estados para filtros
  const [selectedSafra, setSelectedSafra] = useState<string>(getCurrentSafra())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  
  const isCopersucar = company?.id === COPERSUCAR_ID

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!clientLoading && company?.id) {
      // Resetar filtros quando empresa mudar
      const isCopersucarCompany = company.id === COPERSUCAR_ID
      if (isCopersucarCompany) {
        setSelectedSafra(getCurrentSafra())
      } else {
        setSelectedYear(new Date().getFullYear())
      }
      loadHourStats()
    }
  }, [clientLoading, company?.id])

  useEffect(() => {
    if (!clientLoading && company?.id) {
      loadAnalyticsData()
    }
  }, [selectedSafra, selectedYear, company?.id])

  const loadHourStats = async () => {
    if (!company?.id) return
    
    try {
      const stats = await HourService.getDashboardHourStats(company.id)
      setHourStats(stats)
    } catch (error) {
      console.error("Erro ao carregar estatísticas de horas:", error)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // Buscar dados do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (!company?.id) {
        setLoading(false)
        return
      }

      // Calcular período de filtro
      let startDate: string | undefined
      let endDate: string | undefined
      
      const isCopersucarCompany = company.id === COPERSUCAR_ID
      
      if (isCopersucarCompany && selectedSafra) {
        // Filtro por safra (Copersucar)
        const period = getSafraPeriod(selectedSafra)
        if (period) {
          startDate = period.start
          endDate = period.end
        }
      } else if (!isCopersucarCompany) {
        // Filtro por ano calendário (outros clientes)
        startDate = `${selectedYear}-01-01`
        endDate = `${selectedYear}-12-31`
      }

      // Buscar dados de analytics filtrados pela empresa do cliente e período
      const analyticsService = new AnalyticsService()
      const data = await analyticsService.getAnalyticsData(undefined, company.id, startDate, endDate)
      
      setAnalyticsData(data)
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (clientLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <Activity className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-800 font-bold text-lg">Carregando Analytics</p>
            <p className="text-slate-500 text-sm mt-1">Processando dados dos projetos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
          <p className="text-slate-600 font-medium">Não foi possível carregar os dados</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Configuração dos gráficos
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: 'bold' },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false }
      }
    }
  }

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: 'bold' },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 11 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false }
      }
    }
  }

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
      }
    }
  }

  // Dados para o gráfico de linha (Evolução Temporal)
  const timelineChartData = {
    labels: analyticsData.timeline.map(t => t.month),
    datasets: [
      {
        label: 'Iniciados',
        data: analyticsData.timeline.map(t => t.started),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Concluídos',
        data: analyticsData.timeline.map(t => t.completed),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Atrasados',
        data: analyticsData.timeline.map(t => t.delayed),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  // Dados para o gráfico de distribuição por status
  const statusChartData = {
    labels: analyticsData.statusDistribution.map(s => s.label),
    datasets: [{
      data: analyticsData.statusDistribution.map(s => s.value),
      backgroundColor: analyticsData.statusDistribution.map(s => s.color),
      borderWidth: 0,
    }],
  }

  // Dados para o gráfico de horas consumidas vs contratadas
  const hoursChartData = {
    labels: ['Horas Contratadas', 'Horas Consumidas', 'Horas Restantes'],
    datasets: [
      {
        label: 'Horas',
        data: [
          hourStats.totalContractedHours,
          hourStats.totalConsumedHours,
          hourStats.totalRemainingHours
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  }

  return (
    <div className="space-y-6 w-full">
      {/* Fundo decorativo animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Analytics
              </h1>
            </div>
          </div>
          <p className="text-slate-600 text-base ml-[72px]">Análise completa e visual dos seus projetos</p>
        </div>

        {/* Filtro de Período */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {isCopersucar ? 'Ano Safra:' : 'Ano:'}
                </span>
              </div>
              
              {isCopersucar ? (
                <>
                  <Select value={selectedSafra} onValueChange={setSelectedSafra}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione a safra" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSafras().map((safra) => (
                        <SelectItem key={safra} value={safra}>
                          {safra}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedSafra && (() => {
                    const period = getSafraPeriod(selectedSafra)
                    return period ? (
                      <div className="text-sm text-slate-500">
                        Período: {new Date(period.start).toLocaleDateString('pt-BR')} até {new Date(period.end).toLocaleDateString('pt-BR')}
                      </div>
                    ) : null
                  })()}
                </>
              ) : (
                <>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Projetos Complexos */}
        {(analyticsData.alerts.length > 0 || analyticsData.complexProjects.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cards de Alertas */}
            {analyticsData.alerts.map((alert, index) => {
              const projectCount = alert.projects?.length || 0
              const colorClass = alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'violet' : 'emerald'
              const colorMap = {
                red: {
                  bg: 'from-white to-red-50/30',
                  blur: 'from-red-500/10 to-orange-500/10',
                  blurHover: 'from-red-500/20 to-orange-500/20',
                  iconBg: 'bg-red-100',
                  iconText: 'text-red-600',
                  text: 'text-red-700',
                  number: 'text-red-700'
                },
                violet: {
                  bg: 'from-white to-violet-50/30',
                  blur: 'from-violet-500/10 to-purple-500/10',
                  blurHover: 'from-violet-500/20 to-purple-500/20',
                  iconBg: 'bg-violet-100',
                  iconText: 'text-violet-600',
                  text: 'text-violet-700',
                  number: 'text-violet-700'
                },
                emerald: {
                  bg: 'from-white to-emerald-50/30',
                  blur: 'from-emerald-500/10 to-green-500/10',
                  blurHover: 'from-emerald-500/20 to-green-500/20',
                  iconBg: 'bg-emerald-100',
                  iconText: 'text-emerald-600',
                  text: 'text-emerald-700',
                  number: 'text-emerald-700'
                }
              }
              const colors = colorMap[colorClass as keyof typeof colorMap]
              
              return (
                <Card 
                  key={index}
                  className={`relative overflow-hidden border-0 bg-gradient-to-br ${colors.bg} shadow-md hover:shadow-xl transition-all duration-300 group ${
                    alert.projects && alert.projects.length > 0 ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (alert.projects && alert.projects.length > 0) {
                      setExpandedAlerts(prev => {
                        const newSet = new Set(prev)
                        if (newSet.has(index)) {
                          newSet.delete(index)
                        } else {
                          newSet.add(index)
                        }
                        return newSet
                      })
                    }
                  }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.blur} rounded-full blur-2xl transition-all duration-500 group-hover:opacity-100`} />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className={`text-sm font-medium text-slate-600 mb-1 ${colors.text}`}>
                          {alert.message}
                        </p>
                        <p className={`text-3xl font-bold ${colors.number}`}>
                          {projectCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {projectCount === 1 ? 'projeto próximo' : 'projetos próximos'} da data de entrega
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                        {alert.type === 'danger' && <AlertTriangle className={`w-6 h-6 ${colors.iconText}`} />}
                        {alert.type === 'warning' && <Clock className={`w-6 h-6 ${colors.iconText}`} />}
                        {alert.type === 'success' && <CheckCircle className={`w-6 h-6 ${colors.iconText}`} />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Card de Projetos Complexos */}
            {analyticsData.complexProjects.length > 0 && (
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-violet-50/30 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  setExpandedAlerts(prev => {
                    const newSet = new Set(prev)
                    const complexKey = 'complex-projects'
                    if (newSet.has(complexKey)) {
                      newSet.delete(complexKey)
                    } else {
                      newSet.add(complexKey)
                    }
                    return newSet
                  })
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:opacity-100" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1 text-violet-700">Projetos Complexos Detectados</p>
                      <p className="text-3xl font-bold text-violet-700">{analyticsData.complexProjects.length}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {analyticsData.complexProjects.length === 1 ? 'projeto possui' : 'projetos possuem'} tarefas com longos períodos de espera ({">"} 30 dias)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-100">
                      <AlertTriangle className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lista expandida de projetos dos alertas */}
        {analyticsData.alerts.some((alert, index) => alert.projects && alert.projects.length > 0 && expandedAlerts.has(index)) && (
          <div className="space-y-4">
            {analyticsData.alerts.map((alert, index) => {
              if (!alert.projects || alert.projects.length === 0 || !expandedAlerts.has(index)) return null
              
              const colorClass = alert.type === 'danger' ? 'red' : alert.type === 'warning' ? 'violet' : 'emerald'
              
              return (
                <Card key={`expanded-${index}`} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold ${
                        colorClass === 'red' ? 'text-red-700' :
                        colorClass === 'violet' ? 'text-violet-700' :
                        'text-emerald-700'
                      }`}>
                        {alert.message}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {alert.projects.map((project, pIndex) => {
                        const deadline = project.predicted_end_date || project.end_date
                        const deadlineDate = deadline ? new Date(deadline).toLocaleDateString('pt-BR') : 'Sem data'
                        
                        return (
                          <div 
                            key={pIndex}
                            className={`relative p-4 rounded-xl bg-white border-2 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] ${
                              colorClass === 'red' ? 'border-red-200 hover:border-red-300' :
                              colorClass === 'violet' ? 'border-violet-200 hover:border-violet-300' :
                              'border-emerald-200 hover:border-emerald-300'
                            }`}
                          >
                            {/* Borda lateral sutil */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                              colorClass === 'red' ? 'bg-red-500' :
                              colorClass === 'violet' ? 'bg-violet-500' :
                              'bg-emerald-500'
                            }`} />
                            
                            <div className="flex items-start justify-between gap-3 ml-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-slate-800 truncate">
                                    {project.name || 'Projeto sem nome'}
                                  </h4>
                                  {project.daysUntilDeadline !== undefined && (
                                    <Badge 
                                      variant="outline"
                                      className={`shrink-0 border-2 ${
                                        project.daysUntilDeadline === 0 ? 'bg-white text-red-700 border-red-300' :
                                        project.daysUntilDeadline <= 2 ? 'bg-white text-violet-700 border-violet-300' :
                                        'bg-white text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {project.daysUntilDeadline === 0 ? 'Hoje!' :
                                       project.daysUntilDeadline === 1 ? 'Amanhã' :
                                       `${project.daysUntilDeadline} dias`}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                  <span className="inline-flex items-center gap-1 text-slate-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {deadlineDate}
                                  </span>
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/dashboard/projects/${project.id}`)
                                }}
                                className="shrink-0 bg-white border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all"
                              >
                                Ver detalhes →
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Lista expandida de projetos complexos */}
        {analyticsData.complexProjects.length > 0 && expandedAlerts.has('complex-projects') && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-violet-700">
                  Projetos Complexos Detectados
                </h3>
              </div>
              <div className="space-y-3">
                {analyticsData.complexProjects.map((project, index) => {
                  const companyName = company?.name || 'Empresa não informada'
                  
                  return (
                    <div 
                      key={index}
                      className={`relative p-4 bg-white border-2 rounded-xl shadow-sm transition-all hover:shadow-md hover:scale-[1.01] ${
                        project.maxDelay > 60 ? 'border-red-200 hover:border-red-300' :
                        project.maxDelay > 45 ? 'border-violet-200 hover:border-violet-300' :
                        'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Barra lateral de severidade */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        project.maxDelay > 60 ? 'bg-red-500' :
                        project.maxDelay > 45 ? 'bg-violet-500' :
                        'bg-slate-400'
                      }`} />
                      
                      <div className="flex items-start justify-between gap-3 ml-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 truncate">
                              {project.name}
                            </h4>
                            <Badge variant="outline" className="bg-white border-2 border-violet-300 text-violet-700 shrink-0">
                              {project.delayedTasksCount} {project.delayedTasksCount === 1 ? 'tarefa' : 'tarefas'} atrasada{project.delayedTasksCount > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Building2 className="w-3.5 h-3.5" />
                              {companyName}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className={`inline-flex items-center gap-1 font-medium ${
                              project.maxDelay > 60 ? 'text-red-600' :
                              project.maxDelay > 45 ? 'text-violet-600' :
                              'text-slate-600'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Maior atraso: {project.maxDelay} dias
                            </span>
                          </div>
                          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-700">
                              <strong>💡 Recomendação:</strong> Documente os impedimentos usando <strong>"Justificativa de Atraso"</strong>
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/projects/${project.id}`)
                          }}
                          className="shrink-0 bg-white border-2 border-violet-500 text-violet-600 hover:bg-violet-50 shadow-sm hover:shadow-md transition-all"
                        >
                          Ver projeto →
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs - Todos os Status */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total de Projetos */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total de Projetos</p>
                  <p className="text-3xl font-bold text-blue-700">{analyticsData.totalProjects}</p>
                  {analyticsData.totalChange !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 ${analyticsData.totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsData.totalChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-xs font-semibold">{Math.abs(analyticsData.totalChange)}% vs mês anterior</span>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planejamento */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-sky-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-full blur-2xl group-hover:from-sky-500/20 group-hover:to-blue-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Planejamento</p>
                  <p className="text-3xl font-bold text-sky-700">{analyticsData.planning}</p>
                  <p className="text-xs text-slate-500 mt-2">Aguardando início</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-100">
                  <Calendar className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposta Comercial */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-violet-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:from-violet-500/20 group-hover:to-purple-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Proposta Comercial</p>
                  <p className="text-3xl font-bold text-violet-700">{analyticsData.commercialProposal}</p>
                  <p className="text-xs text-slate-500 mt-2">Em negociação</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-100">
                  <Building2 className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Em Andamento */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-green-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Em Andamento</p>
                  <p className="text-3xl font-bold text-green-700">{analyticsData.inProgress}</p>
                  {analyticsData.inProgressChange !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 ${analyticsData.inProgressChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsData.inProgressChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-xs font-semibold">{Math.abs(analyticsData.inProgressChange)}% vs mês anterior</span>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pausados */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-orange-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-2xl group-hover:from-orange-500/20 group-hover:to-amber-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pausados</p>
                  <p className="text-3xl font-bold text-orange-700">{analyticsData.onHold}</p>
                  <p className="text-xs text-slate-500 mt-2">Temporariamente</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atrasados */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-red-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-2xl group-hover:from-red-500/20 group-hover:to-orange-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Atrasados</p>
                  <p className="text-3xl font-bold text-red-700">{analyticsData.delayed}</p>
                  {analyticsData.delayedChange !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 ${analyticsData.delayedChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsData.delayedChange < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      <span className="text-xs font-semibold">{Math.abs(analyticsData.delayedChange)}% vs mês anterior</span>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Concluídos */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-indigo-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Concluídos</p>
                  <p className="text-3xl font-bold text-indigo-700">{analyticsData.completed}</p>
                  <p className="text-xs text-slate-500 mt-2">Finalizados</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancelados */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/30 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-full blur-2xl group-hover:from-slate-500/20 group-hover:to-gray-500/20 transition-all duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-slate-700">{analyticsData.cancelled}</p>
                  <p className="text-xs text-slate-500 mt-2">Descontinuados</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principais */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Evolução Temporal */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <CardTitle>Evolução Temporal</CardTitle>
              </div>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Line data={timelineChartData} options={lineChartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Status */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                <CardTitle>Distribuição por Status</CardTitle>
              </div>
              <CardDescription>Situação atual dos projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Doughnut data={statusChartData} options={doughnutOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Horas Consumidas vs Contratadas */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <CardTitle>Horas Consumidas vs Contratadas</CardTitle>
              </div>
              <CardDescription>
                Contratadas: {formatDecimalToHHMM(hourStats.totalContractedHours)} | 
                Consumidas: {formatDecimalToHHMM(hourStats.totalConsumedHours)} | 
                Restantes: {formatDecimalToHHMM(hourStats.totalRemainingHours)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={hoursChartData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

