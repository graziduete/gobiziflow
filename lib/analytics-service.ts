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
    plannedProjects?: string[]
    realizedProjects?: string[]
    predictedProjects?: string[]
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
    projects?: Array<{
      id: string
      name?: string
      status: string
      end_date?: string
      predicted_end_date?: string
      company_id: string
      daysUntilDeadline?: number
    }>
  }[]

  // Projetos complexos
  complexProjects: Array<{
    id: string
    name: string
    company_id: string
    status: string
    maxDelay: number
    delayedTasksCount: number
  }>
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
      console.log('🔄 [Analytics] Iniciando busca de dados...')
      const startTime = Date.now()
      
      // 1. Buscar projetos com filtros (query otimizada)
      let projectsQuery = this.supabase
        .from('projects')
        .select('id, name, status, project_type, created_at, start_date, end_date, predicted_end_date, actual_end_date, company_id, safra')

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

      const { data: allProjects, error } = await projectsQuery
      
      // Aplicar filtros de data no código (mais flexível para lógica de sobreposição)
      let projects = allProjects || []
      
      if (startDate && endDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        
        // Extrair safra do período (ex: "2026/27" de "2026-04-01" até "2027-03-31")
        const safraYear = start.getFullYear()
        const safraEndYear = end.getFullYear()
        const safraString = `${safraYear}/${safraEndYear.toString().slice(-2)}`
        
        projects = projects.filter((project: any) => {
          // PRIORIDADE 1: Se o projeto tem campo safra definido, usar ele (mais preciso)
          if (project.safra && project.safra.trim() !== '') {
            // Normalizar formato da safra (pode ser "2026/27" ou "2026/2027")
            const projectSafra = project.safra.trim()
            const safraMatch = projectSafra.match(/(\d{4})\/(\d{2,4})/)
            if (safraMatch) {
              const projSafraYear = parseInt(safraMatch[1])
              const projSafraEndYearShort = parseInt(safraMatch[2])
              const projSafraEndYear = projSafraEndYearShort < 100 ? 2000 + projSafraEndYearShort : projSafraEndYearShort
              const projSafraString = `${projSafraYear}/${projSafraEndYear.toString().slice(-2)}`
              
              // Se a safra do projeto corresponde à safra filtrada, incluir
              if (projSafraString === safraString) {
                return true
              } else {
                // Safra não corresponde, não incluir
                return false
              }
            }
          }
          
          // PRIORIDADE 2: Se não tem safra definida, usar lógica de datas
          // Projetos em status que não dependem de datas (proposta comercial, planejamento)
          // devem ser incluídos APENAS se tiverem datas que se sobrepõem ao período
          const statusWithoutDates = ['commercial_proposal', 'planning']
          const isStatusWithoutDates = statusWithoutDates.includes(project.status)
          
          // Para outros status, verificar sobreposição de datas
          // Caso 1: Tem ambas as datas
          if (project.start_date && project.end_date) {
            const projStart = new Date(project.start_date)
            projStart.setHours(0, 0, 0, 0)
            const projEnd = new Date(project.end_date)
            projEnd.setHours(23, 59, 59, 999)
            // Sobreposição: projeto começa antes do fim do período E termina depois do início do período
            const overlaps = projStart <= end && projEnd >= start
            
            // Se é status sem datas e não há sobreposição, não incluir
            if (isStatusWithoutDates && !overlaps) {
              return false
            }
            
            return overlaps
          } 
          // Caso 2: Só tem start_date
          else if (project.start_date) {
            const projStart = new Date(project.start_date)
            projStart.setHours(0, 0, 0, 0)
            // Incluir se começou antes ou durante o período
            const includes = projStart <= end
            
            // Se é status sem datas e não há inclusão, não incluir
            if (isStatusWithoutDates && !includes) {
              return false
            }
            
            return includes
          } 
          // Caso 3: Só tem end_date
          else if (project.end_date) {
            const projEnd = new Date(project.end_date)
            projEnd.setHours(23, 59, 59, 999)
            // Incluir se termina durante ou depois do período
            const includes = projEnd >= start
            
            // Se é status sem datas e não há inclusão, não incluir
            if (isStatusWithoutDates && !includes) {
              return false
            }
            
            return includes
          } 
          // Caso 4: Não tem datas, usar created_at
          else if (project.created_at) {
            const created = new Date(project.created_at)
            created.setHours(0, 0, 0, 0)
            // Incluir se foi criado durante o período
            const inPeriod = created >= start && created <= end
            
            // Se é status sem datas e não está no período, não incluir
            if (isStatusWithoutDates && !inPeriod) {
              return false
            }
            
            return inPeriod
          }
          
          // Se não tem nenhuma data e é status sem datas, não incluir (muito restritivo)
          return false
        })
        
      }
      
      console.log(`✅ [Analytics] Projetos carregados em ${Date.now() - startTime}ms`)

      if (error) {
        console.error('Erro ao buscar projetos:', error)
        return this.getEmptyData()
      }

      // 2. Calcular KPIs
      const total = projects.length || 0
      const inProgress = projects.filter(p => 
        p.status === 'in_progress' || p.status === 'homologation'
      ).length || 0
      const delayed = projects.filter(p => p.status === 'delayed').length || 0
      const onHold = projects.filter(p => p.status === 'on_hold').length || 0
      const commercialProposal = projects.filter(p => p.status === 'commercial_proposal').length || 0
      const completed = projects.filter(p => p.status === 'completed').length || 0
      const planning = projects.filter(p => p.status === 'planning').length || 0
      const cancelled = projects.filter(p => p.status === 'cancelled').length || 0

      // 3. Calcular mudanças (mês anterior)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const lastMonthProjects = projects.filter(p => 
        new Date(p.created_at) < lastMonth
      ) || []

      const totalChange = Math.round(((total - lastMonthProjects.length) / Math.max(lastMonthProjects.length, 1)) * 100)
      const inProgressChange = 3 // Mock por enquanto
      const delayedChange = -2 // Mock por enquanto

      // 4. Distribuição por status
      const statusDistribution = [
        { label: 'Em Andamento', value: inProgress, color: '#10b981' },
        { label: 'Atrasados', value: delayed, color: '#ef4444' },
        { label: 'Pausados', value: onHold, color: '#f59e0b' },
        { label: 'Proposta', value: commercialProposal, color: '#3b82f6' },
        { label: 'Planejamento', value: planning, color: '#8b5cf6' },
        { label: 'Concluídos', value: completed, color: '#6366f1' },
        { label: 'Cancelados', value: cancelled, color: '#64748b' },
      ].filter(item => item.value > 0)

      // 5. Distribuição por tipo
      const typeMap = new Map<string, number>()
      projects.forEach(p => {
        const type = this.getProjectTypeLabel(p.project_type)
        typeMap.set(type, (typeMap.get(type) || 0) + 1)
      })
      const typeDistribution = Array.from(typeMap.entries()).map(([label, value]) => ({
        label,
        value
      }))

      // 6. Projetos por empresa (busca otimizada separada)
      const companyMap = new Map<string, { name: string; count: number }>()
      
      // Buscar nomes das empresas apenas se necessário
      if (projects && projects.length > 0) {
        const uniqueCompanyIds = [...new Set(projects.map(p => p.company_id).filter(Boolean))]
        
        if (uniqueCompanyIds.length > 0) {
          const { data: companies } = await this.supabase
            .from('companies')
            .select('id, name')
            .in('id', uniqueCompanyIds)
          
          const companyNameMap = new Map(companies?.map(c => [c.id, c.name]) || [])
          
          projects.forEach(p => {
            if (p.company_id) {
              const companyName = companyNameMap.get(p.company_id) || 'Sem nome'
              if (!companyMap.has(p.company_id)) {
                companyMap.set(p.company_id, { name: companyName, count: 0 })
              }
              const current = companyMap.get(p.company_id)!
              current.count++
            }
          })
        }
      }
      
      const projectsByCompany = Array.from(companyMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(({ name, count }) => ({ companyName: name, count }))

      // 7. Evolução temporal (últimos 6 meses)
      const timeline = this.calculateTimeline(projects)

      // 8. Performance trimestral (REAL)
      const performance = this.calculateQuarterlyPerformance(projects)

      // 9. Carga mensal (baseado no período filtrado)
      const monthlyLoad = this.calculateMonthlyLoad(projects, startDate, endDate)

      // 10. Alertas
      const alerts = this.generateAlerts(delayed, inProgress, completed, projects)

      // 11. Projetos complexos (com tarefas atrasadas > 30 dias)
      const complexProjects = await this.detectComplexProjects(projects, tenantId)
      console.log('🔍 [Analytics] Projetos complexos detectados:', complexProjects.length, complexProjects)

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
        alerts,
        complexProjects
      }
    } catch (error) {
      console.error('Erro no AnalyticsService:', error)
      return this.getEmptyData()
    }
  }

  private getProjectTypeLabel(type: string | null): string {
    const labels: Record<string, string> = {
      'automation': 'Automação',
      'data_analytics': 'Data & Analytics',
      'digital_development': 'Desenvolvimento',
      'design': 'Design',
      'consulting': 'Consultoria',
      'project_management': 'PMO',
      'system_integration': 'Integração',
      'infrastructure': 'Infraestrutura',
      'support': 'Suporte',
      'training': 'Treinamento'
    }
    return labels[type || ''] || 'Não Definido'
  }

  private calculateQuarterlyPerformance(projects: any[]) {
    const currentYear = new Date().getFullYear()
    const quarters = [
      { quarter: `Q1/${currentYear}`, startMonth: 0, endMonth: 2 },   // Jan-Mar
      { quarter: `Q2/${currentYear}`, startMonth: 3, endMonth: 5 },   // Abr-Jun
      { quarter: `Q3/${currentYear}`, startMonth: 6, endMonth: 8 },   // Jul-Set
      { quarter: `Q4/${currentYear}`, startMonth: 9, endMonth: 11 },  // Out-Dez
    ]

    return quarters.map(({ quarter, startMonth, endMonth }) => {
      const quarterStart = new Date(currentYear, startMonth, 1)
      quarterStart.setHours(0, 0, 0, 0)
      const quarterEnd = new Date(currentYear, endMonth + 1, 0)
      quarterEnd.setHours(23, 59, 59, 999)

      // PLANEJADO: Projetos que deveriam ser concluídos no trimestre (end_date)
      const plannedList = projects.filter(p => {
        if (!p.end_date) return false
        const endDate = new Date(p.end_date)
        return endDate >= quarterStart && endDate <= quarterEnd
      })
      const planned = plannedList.length
      const plannedProjects = plannedList.map(p => p.name || 'Sem nome')

      // REALIZADO: Projetos realmente concluídos no trimestre (actual_end_date + status completed)
      const realizedList = projects.filter(p => {
        if (p.status !== 'completed' || !p.actual_end_date) return false
        const actualEndDate = new Date(p.actual_end_date)
        return actualEndDate >= quarterStart && actualEndDate <= quarterEnd
      })
      const realized = realizedList.length
      const realizedProjects = realizedList.map(p => p.name || 'Sem nome')

      // PREVISTO: Projetos em andamento/planejamento com predicted_end_date no trimestre
      const predictedList = projects.filter(p => {
        if (!p.predicted_end_date) return false
        if (p.status === 'completed' || p.status === 'cancelled') return false
        const predictedEndDate = new Date(p.predicted_end_date)
        return predictedEndDate >= quarterStart && predictedEndDate <= quarterEnd
      })
      const predicted = predictedList.length
      const predictedProjects = predictedList.map(p => p.name || 'Sem nome')

      return { quarter, planned, realized, predicted, plannedProjects, realizedProjects, predictedProjects }
    })
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

  private calculateMonthlyLoad(projects: any[], startDate?: string, endDate?: string) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    // Se houver filtro de data, calcular meses baseado no período
    let monthsToShow: { month: string; year: number; date: Date }[] = []
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const current = new Date(start)
      
      while (current <= end) {
        const monthIndex = current.getMonth()
        const monthName = months[monthIndex]
        monthsToShow.push({
          month: monthName,
          year: current.getFullYear(),
          date: new Date(current)
        })
        current.setMonth(current.getMonth() + 1)
      }
    } else {
      // Sem filtro: mostrar ano atual
      const year = new Date().getFullYear()
      monthsToShow = months.map((month, index) => ({
        month,
        year,
        date: new Date(year, index, 15)
      }))
    }
    
    return monthsToShow.map(({ month, year, date }) => {
      const monthDate = new Date(date)
      monthDate.setDate(15) // meio do mês
      
      const activeProjects = projects.filter(p => {
        const start = p.start_date ? new Date(p.start_date) : null
        const end = p.actual_end_date || p.predicted_end_date || p.end_date
        const endDate = end ? new Date(end) : null
        
        return start && start <= monthDate && (!endDate || endDate >= monthDate)
      }).length

      return { month: `${month}/${year.toString().slice(-2)}`, activeProjects }
    })
  }

  private generateAlerts(delayed: number, inProgress: number, completed: number, projects: any[]) {
    const alerts = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Alertas de atraso
    if (delayed > 0) {
      const delayedProjects = projects.filter(p => p.status === 'delayed')
      alerts.push({
        type: 'danger' as const,
        message: `${delayed} ${delayed === 1 ? 'projeto' : 'projetos'} com atraso significativo`,
        icon: 'exclamation-circle',
        projects: delayedProjects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          company_id: p.company_id,
          end_date: p.end_date,
          predicted_end_date: p.predicted_end_date
        }))
      })
    }

    // Projetos próximos da entrega (LÓGICA REAL)
    const projectsNearDeadline = projects.filter(p => {
      // Apenas projetos em andamento ou homologação
      if (p.status !== 'in_progress' && p.status !== 'homologation') return false
      
      // Verificar data de fim (predicted_end_date tem prioridade, depois end_date)
      const deadline = p.predicted_end_date || p.end_date
      if (!deadline) return false
      
      const deadlineDate = new Date(deadline)
      deadlineDate.setHours(0, 0, 0, 0)
      
      // Está entre hoje e 7 dias?
      return deadlineDate >= today && deadlineDate <= sevenDaysFromNow
    })

    if (projectsNearDeadline.length > 0) {
      // Calcular dias até deadline para cada projeto
      const projectsWithDays = projectsNearDeadline.map(p => {
        const deadline = p.predicted_end_date || p.end_date
        const deadlineDate = new Date(deadline)
        deadlineDate.setHours(0, 0, 0, 0)
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          company_id: p.company_id,
          end_date: p.end_date,
          predicted_end_date: p.predicted_end_date,
          daysUntilDeadline
        }
      }).sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline) // Ordenar por urgência

      alerts.push({
        type: 'warning' as const,
        message: `${projectsNearDeadline.length} ${projectsNearDeadline.length === 1 ? 'projeto próximo' : 'projetos próximos'} da data de entrega (próximos 7 dias)`,
        icon: 'clock',
        projects: projectsWithDays
      })
    }

    // Projetos concluídos recentemente (últimos 7 dias)
    const recentlyCompletedProjects = projects.filter(p => {
      if (p.status !== 'completed') return false
      if (!p.actual_end_date) return false
      
      const completedDate = new Date(p.actual_end_date)
      completedDate.setHours(0, 0, 0, 0)
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      return completedDate >= sevenDaysAgo && completedDate <= today
    })

    if (recentlyCompletedProjects.length > 0) {
      alerts.push({
        type: 'success' as const,
        message: `${recentlyCompletedProjects.length} ${recentlyCompletedProjects.length === 1 ? 'projeto concluído' : 'projetos concluídos'} nos últimos 7 dias`,
        icon: 'check',
        projects: recentlyCompletedProjects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          company_id: p.company_id,
          end_date: p.end_date,
          predicted_end_date: p.predicted_end_date,
          actual_end_date: p.actual_end_date
        }))
      })
    }

    return alerts
  }

  private async detectComplexProjects(projects: any[], tenantId?: string | null): Promise<AnalyticsData['complexProjects']> {
    const complexProjects: AnalyticsData['complexProjects'] = []
    
    // Buscar tarefas apenas de projetos em andamento ou atrasados
    const activeProjectIds = projects
      .filter(p => p.status === 'in_progress' || p.status === 'homologation' || p.status === 'delayed')
      .map(p => p.id)
    
    console.log('🔍 [ComplexProjects] Projetos ativos para análise:', activeProjectIds.length)
    
    if (activeProjectIds.length === 0) {
      console.log('⚠️ [ComplexProjects] Nenhum projeto ativo encontrado')
      return []
    }

    try {
      // Buscar todas as tarefas desses projetos em lotes de 10
      console.log('🔍 [ComplexProjects] Buscando tarefas em lotes...')
      const allTasks: any[] = []
      const batchSize = 10
      
      for (let i = 0; i < activeProjectIds.length; i += batchSize) {
        const batch = activeProjectIds.slice(i, i + batchSize)
        console.log(`🔍 [ComplexProjects] Buscando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(activeProjectIds.length / batchSize)}`)
        
        const { data: batchTasks, error: batchError } = await this.supabase
          .from('tasks')
          .select('id, project_id, status, end_date, actual_end_date')
          .in('project_id', batch)

        if (batchError) {
          console.error('❌ [ComplexProjects] Erro no lote:', {
            message: batchError.message,
            details: batchError.details,
            hint: batchError.hint,
            code: batchError.code,
            projectIds: batch
          })
          continue // Pula este lote e continua com o próximo
        }

        if (batchTasks) {
          allTasks.push(...batchTasks)
        }
      }

      console.log('🔍 [ComplexProjects] Total de tarefas encontradas:', allTasks?.length || 0)

      if (!allTasks || allTasks.length === 0) {
        console.log('⚠️ [ComplexProjects] Nenhuma tarefa encontrada')
        return []
      }

      // Filtrar apenas tarefas atrasadas
      const tasks = allTasks.filter(t => 
        t.status === 'completed_delayed' || t.status === 'delayed'
      )

      console.log('🔍 [ComplexProjects] Tarefas atrasadas (delayed/completed_delayed):', tasks.length)

      if (tasks.length === 0) {
        console.log('⚠️ [ComplexProjects] Nenhuma tarefa atrasada encontrada')
        return []
      }

      // Agrupar tarefas por projeto e calcular atrasos
      const projectDelays = new Map<string, { maxDelay: number; count: number }>()
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      tasks.forEach(task => {
        if (!task.end_date) return

        const planned = new Date(task.end_date)
        planned.setHours(12, 0, 0, 0)

        let diffDays = 0
        if (task.status === 'completed_delayed' && task.actual_end_date) {
          const actual = new Date(task.actual_end_date)
          actual.setHours(12, 0, 0, 0)
          diffDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
        } else if (task.status === 'delayed') {
          diffDays = Math.ceil((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Considera complexo se atraso > 30 dias
        if (diffDays > 30) {
          const current = projectDelays.get(task.project_id) || { maxDelay: 0, count: 0 }
          projectDelays.set(task.project_id, {
            maxDelay: Math.max(current.maxDelay, diffDays),
            count: current.count + 1
          })
        }
      })

      // Montar lista de projetos complexos
      projectDelays.forEach((delays, projectId) => {
        const project = projects.find(p => p.id === projectId)
        if (project) {
          complexProjects.push({
            id: project.id,
            name: project.name || 'Sem nome',
            company_id: project.company_id,
            status: project.status,
            maxDelay: delays.maxDelay,
            delayedTasksCount: delays.count
          })
        }
      })

      // Ordenar por maior atraso
      return complexProjects.sort((a, b) => b.maxDelay - a.maxDelay)
    } catch (error) {
      console.error('[Analytics] Erro ao detectar projetos complexos:', error)
      return []
    }
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
      alerts: [],
      complexProjects: []
    }
  }
}


