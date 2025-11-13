import { createBrowserClient } from "@supabase/ssr"

export interface AnalyticsData {
  // KPIs
  totalProjects: number
  inProgress: number // in_progress + homologation
  delayed: number
  onHold: number
  commercialProposal: number
  completed: number
  planning: number
  cancelled: number

  // Trends (comparação com mês anterior)
  totalChange: number
  inProgressChange: number
  delayedChange: number

  // Distribuição por status
  statusDistribution: {
    label: string
    value: number
    color: string
  }[]

  // Distribuição por tipo
  typeDistribution: {
    label: string
    value: number
  }[]

  // Projetos por empresa
  projectsByCompany: {
    companyName: string
    count: number
  }[]

  // Evolução temporal (últimos 6 meses)
  timeline: {
    month: string
    started: number
    completed: number
    delayed: number
  }[]

  // Performance (planejado vs realizado)
  performance: {
    quarter: string
    planned: number
    realized: number
    predicted: number
  }[]

  // Carga mensal
  monthlyLoad: {
    month: string
    activeProjects: number
  }[]

  // Alertas
  alerts: {
    type: 'danger' | 'warning' | 'success'
    message: string
    icon: string
  }[]
}

export class AnalyticsService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async getAnalyticsData(
    tenantId?: string | null,
    companyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsData> {
    try {
      // 1. Buscar projetos com filtros
      let projectsQuery = this.supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          project_type,
          category,
          start_date,
          end_date,
          predicted_end_date,
          actual_end_date,
          created_at,
          company_id,
          companies!inner(name)
        `)

      // Aplicar filtro de tenant
      if (tenantId) {
        projectsQuery = projectsQuery.eq('tenant_id', tenantId)
      } else if (tenantId === null) {
        projectsQuery = projectsQuery.is('tenant_id', null)
      }

      // Aplicar filtro de empresa
      if (companyId && companyId !== 'all') {
        projectsQuery = projectsQuery.eq('company_id', companyId)
      }

      const { data: projects, error } = await projectsQuery

      if (error) {
        console.error('Erro ao buscar projetos:', error)
        return this.getEmptyData()
      }

      // 2. Calcular KPIs
      const total = projects?.length || 0
      const inProgress = projects?.filter(p => 
        p.status === 'in_progress' || p.status === 'homologation'
      ).length || 0
      const delayed = projects?.filter(p => p.status === 'delayed').length || 0
      const onHold = projects?.filter(p => p.status === 'on_hold').length || 0
      const commercialProposal = projects?.filter(p => p.status === 'commercial_proposal').length || 0
      const completed = projects?.filter(p => p.status === 'completed').length || 0
      const planning = projects?.filter(p => p.status === 'planning').length || 0
      const cancelled = projects?.filter(p => p.status === 'cancelled').length || 0

      // 3. Calcular mudanças (mês anterior)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const lastMonthProjects = projects?.filter(p => 
        new Date(p.created_at) < lastMonth
      ) || []

      const totalChange = Math.round(((total - lastMonthProjects.length) / Math.max(lastMonthProjects.length, 1)) * 100)
      const inProgressChange = 3 // Mock por enquanto
      const delayedChange = -2 // Mock por enquanto

      // 4. Distribuição por status
      const statusDistribution = [
        { label: 'Em Execução', value: inProgress, color: '#10b981' },
        { label: 'Atrasados', value: delayed, color: '#ef4444' },
        { label: 'Pausados', value: onHold, color: '#f59e0b' },
        { label: 'Proposta', value: commercialProposal, color: '#3b82f6' },
        { label: 'Planejamento', value: planning, color: '#8b5cf6' },
        { label: 'Concluídos', value: completed, color: '#6366f1' },
        { label: 'Cancelados', value: cancelled, color: '#64748b' },
      ].filter(item => item.value > 0)

      // 5. Distribuição por tipo
      const typeMap = new Map<string, number>()
      projects?.forEach(p => {
        const type = this.getProjectTypeLabel(p.project_type)
        typeMap.set(type, (typeMap.get(type) || 0) + 1)
      })
      const typeDistribution = Array.from(typeMap.entries()).map(([label, value]) => ({
        label,
        value
      }))

      // 6. Projetos por empresa
      const companyMap = new Map<string, number>()
      projects?.forEach(p => {
        const companyName = (p.companies as any)?.name || 'Sem empresa'
        companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1)
      })
      const projectsByCompany = Array.from(companyMap.entries())
        .map(([companyName, count]) => ({ companyName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10

      // 7. Evolução temporal (últimos 6 meses)
      const timeline = this.calculateTimeline(projects || [])

      // 8. Performance (mock por enquanto)
      const performance = [
        { quarter: 'Q1', planned: 45, realized: 38, predicted: 0 },
        { quarter: 'Q2', planned: 38, realized: 35, predicted: 0 },
        { quarter: 'Q3', planned: 42, realized: 40, predicted: 0 },
        { quarter: 'Q4', planned: 50, realized: 0, predicted: 48 },
      ]

      // 9. Carga mensal (2025)
      const monthlyLoad = this.calculateMonthlyLoad(projects || [])

      // 10. Alertas
      const alerts = this.generateAlerts(delayed, inProgress, completed)

      return {
        totalProjects: total,
        inProgress,
        delayed,
        onHold,
        commercialProposal,
        completed,
        planning,
        cancelled,
        totalChange,
        inProgressChange,
        delayedChange,
        statusDistribution,
        typeDistribution,
        projectsByCompany,
        timeline,
        performance,
        monthlyLoad,
        alerts
      }
    } catch (error) {
      console.error('Erro no AnalyticsService:', error)
      return this.getEmptyData()
    }
  }

  private getProjectTypeLabel(type: string | null): string {
    const labels: Record<string, string> = {
      'implementation': 'Implementação',
      'maintenance': 'Manutenção',
      'development': 'Desenvolvimento',
      'consulting': 'Consultoria',
      'support': 'Suporte'
    }
    return labels[type || ''] || 'Outros'
  }

  private calculateTimeline(projects: any[]) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho']
    const now = new Date()
    
    return months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)
      
      const started = projects.filter(p => {
        const startDate = p.start_date ? new Date(p.start_date) : null
        return startDate && startDate >= monthDate && startDate < nextMonth
      }).length

      const completed = projects.filter(p => {
        const endDate = p.actual_end_date ? new Date(p.actual_end_date) : null
        return endDate && endDate >= monthDate && endDate < nextMonth && p.status === 'completed'
      }).length

      const delayed = projects.filter(p => {
        const endDate = p.end_date ? new Date(p.end_date) : null
        return endDate && endDate >= monthDate && endDate < nextMonth && p.status === 'delayed'
      }).length

      return { month, started, completed, delayed }
    })
  }

  private calculateMonthlyLoad(projects: any[]) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const year = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthDate = new Date(year, index, 15) // meio do mês
      
      const activeProjects = projects.filter(p => {
        const start = p.start_date ? new Date(p.start_date) : null
        const end = p.actual_end_date || p.predicted_end_date || p.end_date
        const endDate = end ? new Date(end) : null
        
        return start && start <= monthDate && (!endDate || endDate >= monthDate)
      }).length

      return { month, activeProjects }
    })
  }

  private generateAlerts(delayed: number, inProgress: number, completed: number) {
    const alerts = []

    if (delayed > 0) {
      alerts.push({
        type: 'danger' as const,
        message: `${delayed} ${delayed === 1 ? 'projeto' : 'projetos'} com atraso significativo`,
        icon: 'exclamation-circle'
      })
    }

    // Projetos próximos da entrega (mock)
    if (inProgress > 0) {
      const nearDeadline = Math.min(5, Math.floor(inProgress * 0.3))
      if (nearDeadline > 0) {
        alerts.push({
          type: 'warning' as const,
          message: `${nearDeadline} ${nearDeadline === 1 ? 'projeto próximo' : 'projetos próximos'} da data de entrega (próximos 7 dias)`,
          icon: 'clock'
        })
      }
    }

    // Projetos concluídos recentemente
    const recentlyCompleted = Math.min(completed, 2)
    if (recentlyCompleted > 0) {
      alerts.push({
        type: 'success' as const,
        message: `${recentlyCompleted} ${recentlyCompleted === 1 ? 'projeto concluído' : 'projetos concluídos'} com sucesso esta semana`,
        icon: 'check'
      })
    }

    return alerts
  }

  private getEmptyData(): AnalyticsData {
    return {
      totalProjects: 0,
      inProgress: 0,
      delayed: 0,
      onHold: 0,
      commercialProposal: 0,
      completed: 0,
      planning: 0,
      cancelled: 0,
      totalChange: 0,
      inProgressChange: 0,
      delayedChange: 0,
      statusDistribution: [],
      typeDistribution: [],
      projectsByCompany: [],
      timeline: [],
      performance: [],
      monthlyLoad: [],
      alerts: []
    }
  }
}


