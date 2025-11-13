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

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null | undefined>(undefined)
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set())
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(new Map())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // Buscar dados do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Verificar perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      setUserRole(profile?.role || null)

      // Verificar se é Client Admin
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()

      let tenantFilter: string | null | undefined = undefined

      if (clientAdmin) {
        // Client Admin - filtrar por tenant_id
        tenantFilter = clientAdmin.company_id
      } else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
        // Admin Normal - filtrar por tenant_id null
        tenantFilter = null
      }
      // Admin Master - sem filtro (undefined)

      setTenantId(tenantFilter)

      // Buscar dados de analytics
      const analyticsService = new AnalyticsService()
      const data = await analyticsService.getAnalyticsData(tenantFilter)
      
      setAnalyticsData(data)

      // Buscar nomes das empresas dos projetos nos alertas
      const companyIds = new Set<string>()
      data.alerts.forEach(alert => {
        alert.projects?.forEach(project => {
          if (project.company_id) {
            companyIds.add(project.company_id)
          }
        })
      })

      if (companyIds.size > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', Array.from(companyIds))
        
        const nameMap = new Map(companies?.map(c => [c.id, c.name]) || [])
        setCompanyNames(nameMap)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
          <p className="text-slate-600 font-medium">Não foi possível carregar os dados</p>
          <Button onClick={() => router.push('/admin')}>
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

  // Opções especiais para o gráfico de performance com tooltip customizado
  const performanceChartOptions: ChartOptions<'bar'> = {
    ...barChartOptions,
    plugins: {
      ...barChartOptions.plugins,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          afterLabel: function(context) {
            const dataIndex = context.dataIndex
            const datasetIndex = context.datasetIndex
            const performance = analyticsData.performance[dataIndex]
            
            let projects: string[] = []
            if (datasetIndex === 0 && performance.plannedProjects) {
              projects = performance.plannedProjects
            } else if (datasetIndex === 1 && performance.realizedProjects) {
              projects = performance.realizedProjects
            } else if (datasetIndex === 2 && performance.predictedProjects) {
              projects = performance.predictedProjects
            }
            
            if (projects.length === 0) return ''
            
            return '\n' + projects.map((name, i) => `  ${i + 1}. ${name}`).join('\n')
          }
        }
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

  // Dados para o gráfico de distribuição por tipo
  const typeChartData = {
    labels: analyticsData.typeDistribution.map(t => t.label),
    datasets: [{
      label: 'Projetos',
      data: analyticsData.typeDistribution.map(t => t.value),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderRadius: 8,
    }],
  }

  // Dados para o gráfico de performance
  const performanceChartData = {
    labels: analyticsData.performance.map(p => p.quarter),
    datasets: [
      {
        label: 'Planejado',
        data: analyticsData.performance.map(p => p.planned),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Realizado',
        data: analyticsData.performance.map(p => p.realized),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Previsto',
        data: analyticsData.performance.map(p => p.predicted),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 8,
      },
    ],
  }

  // Dados para o gráfico de carga mensal
  const monthlyLoadChartData = {
    labels: analyticsData.monthlyLoad.map(m => m.month),
    datasets: [{
      label: 'Projetos Ativos',
      data: analyticsData.monthlyLoad.map(m => m.activeProjects),
      borderColor: 'rgb(139, 92, 246)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgb(139, 92, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Fundo decorativo animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              Analytics
            </h1>
            <p className="text-slate-600 text-base">Análise completa e visual dos seus projetos</p>
          </div>
          <Button 
            onClick={() => router.push('/admin')}
            variant="outline"
            size="lg"
            className="bg-white hover:bg-slate-50 border-2 shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Alertas */}
        {analyticsData.alerts.length > 0 && (
          <div className="space-y-3">
            {analyticsData.alerts.map((alert, index) => (
              <Card 
                key={index}
                className={`border-l-4 transition-all ${
                  alert.type === 'danger' ? 'border-red-500 bg-red-50/50' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50/50' :
                  'border-green-500 bg-green-50/50'
                }`}
              >
                <CardContent className="p-4">
                  <div 
                    className={`flex items-center justify-between ${alert.projects && alert.projects.length > 0 ? 'cursor-pointer' : ''}`}
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
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.type === 'danger' ? 'bg-red-100' :
                        alert.type === 'warning' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        {alert.type === 'danger' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                        {alert.type === 'warning' && <Clock className="w-5 h-5 text-yellow-600" />}
                        {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <p className={`font-medium ${
                        alert.type === 'danger' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                    
                    {alert.projects && alert.projects.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={`${
                          alert.type === 'danger' ? 'hover:bg-red-100 text-red-700' :
                          alert.type === 'warning' ? 'hover:bg-yellow-100 text-yellow-700' :
                          'hover:bg-green-100 text-green-700'
                        }`}
                      >
                        {expandedAlerts.has(index) ? 'Ocultar' : 'Ver Projetos'}
                      </Button>
                    )}
                  </div>

                  {/* Lista de projetos expandível */}
                  {alert.projects && alert.projects.length > 0 && expandedAlerts.has(index) && (
                    <div className="mt-4 space-y-2 animate-in slide-in-from-top duration-200">
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-3" />
                      {alert.projects.map((project, pIndex) => {
                        const companyName = companyNames.get(project.company_id) || 'Empresa não informada'
                        const deadline = project.predicted_end_date || project.end_date
                        const deadlineDate = deadline ? new Date(deadline).toLocaleDateString('pt-BR') : 'Sem data'
                        
                        return (
                          <div 
                            key={pIndex}
                            className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                              alert.type === 'danger' ? 'bg-white border-red-200 hover:border-red-300' :
                              alert.type === 'warning' ? 'bg-white border-yellow-200 hover:border-yellow-300' :
                              'bg-white border-green-200 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-slate-800 truncate">
                                    {project.name || 'Projeto sem nome'}
                                  </h4>
                                  {project.daysUntilDeadline !== undefined && (
                                    <Badge 
                                      variant="outline"
                                      className={`shrink-0 ${
                                        project.daysUntilDeadline === 0 ? 'bg-red-100 text-red-700 border-red-300' :
                                        project.daysUntilDeadline <= 2 ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                        'bg-yellow-100 text-yellow-700 border-yellow-300'
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
                                    <Building2 className="w-3.5 h-3.5" />
                                    {companyName}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="inline-flex items-center gap-1 text-slate-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {deadlineDate}
                                  </span>
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/projects/${project.id}`)}
                                className="shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                Ver detalhes →
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Projetos Complexos Detectados */}
        {analyticsData.complexProjects.length > 0 && (
          <Card className="border-l-4 border-amber-500 bg-amber-50/50 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">⚠️ Projetos Complexos Detectados</h3>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {analyticsData.complexProjects.length} {analyticsData.complexProjects.length === 1 ? 'projeto possui' : 'projetos possuem'} tarefas com longos períodos de espera ({">"} 30 dias)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {analyticsData.complexProjects.map((project, index) => {
                  const companyName = companyNames.get(project.company_id) || 'Empresa não informada'
                  
                  return (
                    <div 
                      key={index}
                      className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 truncate">
                              {project.name}
                            </h4>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 shrink-0">
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
                              project.maxDelay > 45 ? 'text-orange-600' :
                              'text-amber-600'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Maior atraso: {project.maxDelay} dias
                            </span>
                          </div>
                          <p className="text-xs text-amber-700 mt-2">
                            💡 <strong>Recomendação:</strong> Documente os impedimentos usando <strong>"Justificativa de Atraso"</strong>
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/projects/${project.id}`)}
                          className="shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
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

          {/* Distribuição por Tipo */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <CardTitle>Distribuição por Tipo</CardTitle>
              </div>
              <CardDescription>Categorias de projeto</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={typeChartData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Performance Trimestral */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <CardTitle>Performance Trimestral</CardTitle>
              </div>
              <CardDescription>Planejado vs Realizado (passe o mouse para ver os projetos)</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={performanceChartData} options={performanceChartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de carga mensal (full width) */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <CardTitle>Carga Mensal de Projetos Ativos (2025)</CardTitle>
            </div>
            <CardDescription>Quantidade de projetos ativos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '350px' }}>
              <Line data={monthlyLoadChartData} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Projetos por Empresa */}
        {analyticsData.projectsByCompany.length > 0 && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle>Projetos por Empresa</CardTitle>
              </div>
              <CardDescription>Top 10 empresas com mais projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.projectsByCompany.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-slate-800">{company.companyName}</span>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      {company.count} {company.count === 1 ? 'projeto' : 'projetos'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}

