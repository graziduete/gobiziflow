import { createClient } from '@/lib/supabase/client'
import { PaymentMetric, Project, ProjectStatus } from '@/lib/types'

export class DashboardService {
  private static supabase = createClient()

  private static isMonthWithinRange(startDateStr: string, endDateStr: string, monthYear: string): boolean {
    try {
      const [yearStr, monthStr] = monthYear.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr) - 1
      const start = new Date(startDateStr)
      const end = new Date(endDateStr)
      const selectedStart = new Date(year, month, 1)
      const selectedEnd = new Date(year, month + 1, 0)
      // Interseção de intervalos [start, end] e [selectedStart, selectedEnd]
      return !(end < selectedStart || start > selectedEnd)
    } catch {
      return true
    }
  }

  private static isYearWithinRange(startDateStr: string, endDateStr: string, year: string): boolean {
    try {
      const yearNum = parseInt(year)
      const start = new Date(startDateStr)
      const end = new Date(endDateStr)
      const selectedStart = new Date(yearNum, 0, 1) // 1º de janeiro
      const selectedEnd = new Date(yearNum, 11, 31) // 31 de dezembro
      // Interseção de intervalos [start, end] e [selectedStart, selectedEnd]
      return !(end < selectedStart || start > selectedEnd)
    } catch {
      return true
    }
  }

  private static getMonthsDiffInclusive(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    if (end.getDate() >= start.getDate()) months += 1
    return Math.max(months, 1)
  }

  private static getCurrentMonthlyParcelIndex(metric: any, monthYear: string): number {
    const start = new Date(metric.start_date)
    const target = new Date(`${monthYear}-01`)
    const monthsFromStart = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth()) + 1
    const total = this.getMonthsDiffInclusive(metric.start_date, metric.end_date)
    return Math.min(Math.max(monthsFromStart, 1), total)
  }

  // Calcular valor previsto para um ANO específico (Faturamento Total)
  static async getExpectedValueForYear(year: string, filteredCompanyIds?: string[]): Promise<{
    totalExpected: number
    breakdown: Array<{
      companyId: string
      companyName: string
      metricType: string
      expectedValue: number
      details: string
      projectName?: string
      projectStatus?: string
      percentage?: number
    }>
  }> {
    try {
      console.log('📊 Calculando valor previsto para ANO:', year)
      
      const breakdown: Array<{
        companyId: string
        companyName: string
        metricType: string
        expectedValue: number
        details: string
        projectName?: string
        projectStatus?: string
        percentage?: number
      }> = []

      // 1. Buscar todas as métricas ativas
      let metricsQuery = this.supabase
        .from('payment_metrics')
        .select(`
          *,
          companies!inner (
            id,
            name
          )
        `)
        .eq('is_active', true)
      
      // Aplicar filtro de tenant se fornecido
      if (filteredCompanyIds && filteredCompanyIds.length > 0) {
        console.log('🏢 [DashboardService] Aplicando filtro de empresas para ANO:', filteredCompanyIds)
        metricsQuery = metricsQuery.in('company_id', filteredCompanyIds)
      } else {
        console.log('⚠️ [DashboardService] Nenhum filtro de empresas aplicado para ANO - buscando todas as métricas')
      }
      
      const { data: metrics, error: metricsError } = await metricsQuery

      if (metricsError) {
        console.error('❌ Erro ao buscar métricas para ANO:', metricsError)
        throw new Error(`Erro ao buscar métricas: ${metricsError.message}`)
      }

      console.log('📊 Métricas encontradas para ANO:', metrics?.length || 0)

      let totalExpected = 0

      // 2. Processar cada métrica para o ANO
      for (const metric of metrics || []) {
        const companyName = (metric.companies as any)?.name || 'Empresa Desconhecida'
        console.log(`📊 Processando métrica para ANO: ${metric.metric_type} - ${companyName}`)
        
        // Para métricas parceladas, somar TODAS as parcelas do ano
        if (metric.metric_type === 'installments') {
          const installmentInfo = await this.calculateInstallmentsValueForYear(metric, year)
          if (installmentInfo.total > 0) {
            totalExpected += installmentInfo.total
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: 'Parcelado (Ano)',
              expectedValue: Math.round(installmentInfo.total),
              details: installmentInfo.details
            })
            continue
          }
        }

        // Para outras métricas (exceto percentage_phases), verificar se o período intersecta o ano
        if (metric.metric_type !== 'percentage_phases' && !this.isYearWithinRange(metric.start_date, metric.end_date, year)) {
          continue
        }

        if (metric.metric_type === 'monthly_fixed') {
          // Parcelas fixas mensais - calcular para o ano inteiro
          const expectedValue = await this.calculateMonthlyFixedValueForYear(metric, year)
          if (expectedValue > 0) {
            totalExpected += expectedValue
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: 'Parcelas Mensais (Ano)',
              expectedValue,
              details: `Valor anual de R$ ${(expectedValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            })
          }
        } else if (metric.metric_type === 'percentage_phases') {
          // Percentual por fases - calcular para o ano
          console.log(`📊 DEBUG: Processando métrica percentage_phases para ${companyName} (ID: ${metric.company_id})`)
          const projectDetails = await this.calculatePercentagePhasesWithDetailsForYear(metric, year)
          console.log(`📊 DEBUG: projectDetails para ${companyName}:`, projectDetails)
          for (const detail of projectDetails) {
            totalExpected += detail.expectedValue
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: 'Percentual por Fases (Ano)',
              expectedValue: detail.expectedValue,
              details: `${detail.percentage}% do orçamento`,
              projectName: detail.projectName,
              projectStatus: detail.projectStatus,
              percentage: detail.percentage
            })
            console.log(`📊 DEBUG: Adicionando ${detail.expectedValue} ao total. Total atual: ${totalExpected}`)
          }
        }
      }

      console.log('📊 Total previsto para ANO calculado:', totalExpected)
      return {
        totalExpected,
        breakdown
      }
    } catch (error) {
      console.error('❌ Erro ao calcular valor previsto para ANO:', error)
      return {
        totalExpected: 0,
        breakdown: []
      }
    }
  }

  // Calcular valor previsto para um mês específico
  static async getExpectedValueForMonth(monthYear: string, filteredCompanyIds?: string[]): Promise<{
    totalExpected: number
    breakdown: Array<{
      companyId: string
      companyName: string
      metricType: string
      expectedValue: number
      details: string
      projectName?: string
      projectStatus?: string
      percentage?: number
    }>
  }> {
    try {
      console.log('📊 Calculando valor previsto para:', monthYear)
      
      const breakdown: Array<{
        companyId: string
        companyName: string
        metricType: string
        expectedValue: number
        details: string
        projectName?: string
        projectStatus?: string
        percentage?: number
      }> = []

      // 1. Buscar todas as métricas ativas (sem filtro de data por enquanto)
      let metricsQuery = this.supabase
        .from('payment_metrics')
        .select(`
          *,
          companies!inner (
            id,
            name
          )
        `)
        .eq('is_active', true)
      
      // Aplicar filtro de tenant se fornecido
      if (filteredCompanyIds && filteredCompanyIds.length > 0) {
        console.log('🏢 [DashboardService] Aplicando filtro de empresas:', filteredCompanyIds)
        metricsQuery = metricsQuery.in('company_id', filteredCompanyIds)
      } else {
        console.log('⚠️ [DashboardService] Nenhum filtro de empresas aplicado - buscando todas as métricas')
      }
      
      const { data: metrics, error: metricsError } = await metricsQuery

      if (metricsError) {
        console.error('❌ Erro ao buscar métricas:', metricsError)
        throw new Error(`Erro ao buscar métricas: ${metricsError.message}`)
      }

      console.log('📊 Métricas encontradas após filtro:', metrics?.length || 0)
      console.log('📊 Métricas detalhes:', metrics?.map(m => ({
        id: m.id,
        company_id: m.company_id,
        company_name: m.companies?.name,
        amount: m.amount,
        is_active: m.is_active
      })) || [])

      let totalExpected = 0

      // 2. Processar cada métrica
      console.log(`📊 Processando ${metrics?.length || 0} métricas`)
      for (const metric of metrics || []) {
        const companyName = (metric.companies as any)?.name || 'Empresa Desconhecida'
        console.log(`📊 Processando métrica: ${metric.metric_type} - ${companyName}`)
        console.log(`📊 Métrica completa:`, metric)
        
        // Para métricas parceladas, não dependemos do período start/end da métrica.
        // Primeiro, tente somar as parcelas do mês.
        if (metric.metric_type === 'installments') {
          const installmentInfo = await this.calculateInstallmentsValue(metric, monthYear)
          if (installmentInfo.total > 0) {
            totalExpected += installmentInfo.total
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: 'Parcelado',
              expectedValue: Math.round(installmentInfo.total * 100),
              details: installmentInfo.details
            })
            continue
          }
        }

        if (!this.isMonthWithinRange(metric.start_date, metric.end_date, monthYear)) {
          // Ignora as demais métricas cujo período não intersecta o mês selecionado
          continue
        }

        if (metric.metric_type === 'monthly_fixed') {
          // Parcelas fixas mensais
          const expectedValue = await this.calculateMonthlyFixedValue(metric, monthYear)
          if (expectedValue > 0) {
            totalExpected += expectedValue
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: `${this.getCurrentMonthlyParcelIndex(metric, monthYear)} de ${this.getMonthsDiffInclusive(metric.start_date, metric.end_date)} Parcelas Mensais`,
              expectedValue,
              details: `Parcela mensal de R$ ${(expectedValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            })
          }
        } else if (metric.metric_type === 'percentage_phases') {
          // Percentual por fases (atrelado a projetos)
          const projectDetails = await this.calculatePercentagePhasesWithDetails(metric, monthYear)
          for (const detail of projectDetails) {
            totalExpected += detail.expectedValue
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: 'Percentual por Fases',
              expectedValue: detail.expectedValue,
              details: `${detail.percentage}% do orçamento`,
              projectName: detail.projectName,
              projectStatus: detail.projectStatus,
              percentage: detail.percentage
            })
          }
        } else if (metric.metric_type === 'installments') {
          // Se não havia parcelas para o mês (total = 0), nada a fazer
        }
      }

      console.log('📊 Total previsto calculado:', totalExpected)
      console.log('📊 Breakdown:', breakdown)
      console.log('📊 Breakdown detalhado:', JSON.stringify(breakdown, null, 2))

      return {
        totalExpected,
        breakdown
      }
    } catch (error) {
      console.error('❌ Erro ao calcular valor previsto:', error)
      return {
        totalExpected: 0,
        breakdown: []
      }
    }
  }

  // Calcular valor para parcelas fixas mensais
  private static async calculateMonthlyFixedValue(metric: PaymentMetric, monthYear: string): Promise<number> {
    try {
      console.log(`🚀 INICIANDO calculateMonthlyFixedValue`)
      console.log(`📊 Calculando parcelas mensais para ${monthYear}:`, {
        metricId: metric.id,
        totalValue: metric.total_value,
        startDate: metric.start_date,
        endDate: metric.end_date
      })

      // Calcular número de meses no período
      const startDate = new Date(metric.start_date)
      const endDate = new Date(metric.end_date)
      
      // Debug das datas
      console.log(`📊 Start date: ${metric.start_date} -> ${startDate}`)
      console.log(`📊 End date: ${metric.end_date} -> ${endDate}`)
      
      // CORREÇÃO: Cálculo correto de meses
      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth()
      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth()
      
      // Calcular diferença em meses
      let monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth)
      
      // Se o dia do final é maior ou igual ao dia do início, adiciona 1
      if (endDate.getDate() >= startDate.getDate()) {
        monthsDiff += 1
      }
      
      // Valor mensal = total_value / número de meses
      const monthlyValue = Math.round(metric.total_value / monthsDiff)
      
      return monthlyValue
    } catch (error) {
      console.error('❌ Erro ao calcular parcelas mensais:', error)
      return 0
    }
  }

  // Calcular valor para percentual por fases com detalhes por projeto
  private static async calculatePercentagePhasesWithDetails(metric: PaymentMetric, monthYear: string): Promise<Array<{
    projectName: string
    projectStatus: string
    percentage: number
    expectedValue: number
  }>> {
    try {
      // Buscar projetos da empresa com datas para filtrar por mês de mudança
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('id, name, budget, status, created_at, updated_at')
        .eq('company_id', metric.company_id)
        .in('status', ['planning', 'in_progress', 'development', 'testing', 'homologation', 'completed'])

      if (error) {
        console.error('❌ Erro ao buscar projetos:', error)
        return []
      }

      const projectDetails: Array<{
        projectName: string
        projectStatus: string
        percentage: number
        expectedValue: number
      }> = []

      // Processar cada projeto
      for (const project of projects || []) {
        const budget = project.budget || 0
        let totalPercentage = 0

        // Aplicar TODOS os percentuais que o projeto já "atingiu" baseado no status atual
        switch (project.status) {
          case 'completed':
            // Projeto concluído: soma TODOS os percentuais
            totalPercentage = (metric.planning_percentage || 0) + (metric.homologation_percentage || 0) + (metric.completion_percentage || 0)
            break
          case 'in_progress':
          case 'development':
          case 'testing':
          case 'homologation':
            // Projeto em andamento: soma planejamento + homologação
            totalPercentage = (metric.planning_percentage || 0) + (metric.homologation_percentage || 0)
            break
          case 'planning':
            // Projeto em planejamento: apenas percentual de planejamento
            totalPercentage = metric.planning_percentage || 0
            break
          default:
            // Para outros status, usar apenas percentual de planejamento
            totalPercentage = metric.planning_percentage || 0
            break
        }

        // Filtrar por mês/ano selecionado conforme a regra:
        // planning -> mês de created_at; homologation/in_progress/development/testing -> mês de updated_at;
        // completed -> mês de updated_at
        const targetMonth = monthYear
        const getMonthStr = (d?: string) => d ? `${new Date(d).getFullYear()}-${String(new Date(d).getMonth()+1).padStart(2,'0')}` : ''
        let eventMonth = ''
        if (project.status === 'planning') {
          eventMonth = getMonthStr(project.created_at)
        } else {
          eventMonth = getMonthStr(project.updated_at)
        }
        if (eventMonth !== targetMonth) {
          continue
        }

        if (totalPercentage > 0) {
          // budget está em reais; precisamos devolver em centavos
          const expectedValue = Math.round(budget * totalPercentage) // (reais * %) -> centavos
          projectDetails.push({
            projectName: project.name,
            projectStatus: project.status,
            percentage: totalPercentage,
            expectedValue
          })
        }
      }

      console.log(`📊 Projetos com percentual por fases para ${monthYear}:`, projectDetails.length)
      return projectDetails
    } catch (error) {
      console.error('❌ Erro ao calcular percentual por fases:', error)
      return []
    }
  }

  // Calcular valor para percentual por fases (versão antiga - manter para compatibilidade)
  private static async calculatePercentagePhasesValue(metric: PaymentMetric, monthYear: string): Promise<number> {
    try {
      // Buscar projetos ativos da empresa
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('id, name, budget, status')
        .eq('company_id', metric.company_id)
        .in('status', ['planning', 'development', 'testing', 'completed'])

      if (error) {
        console.error('❌ Erro ao buscar projetos:', error)
        return 0
      }

      let totalExpected = 0

      // Processar cada projeto
      for (const project of projects || []) {
        const budget = project.budget || 0
        let percentage = 0

        // Determinar percentual baseado no status do projeto
        switch (project.status) {
          case 'planning':
            percentage = metric.planning_percentage || 0
            break
          case 'in_progress':
          case 'development':
          case 'testing':
          case 'homologation':
            percentage = metric.homologation_percentage || 0
            break
          case 'completed':
            percentage = metric.completion_percentage || 0
            break
          default:
            // Para outros status, usar percentual de planejamento
            percentage = metric.planning_percentage || 0
            break
        }

        if (percentage > 0) {
          const expectedValue = Math.round((budget * percentage) / 100)
          totalExpected += expectedValue
          
          console.log(`📊 Projeto ${project.name}:`, {
            budget: budget / 100,
            status: project.status,
            percentage,
            expectedValue: expectedValue / 100
          })
        }
      }

      console.log(`📊 Total percentual por fases para ${monthYear}:`, totalExpected)
      return totalExpected
    } catch (error) {
      console.error('❌ Erro ao calcular percentual por fases:', error)
      return 0
    }
  }

  // Calcular valor para parcelado (com due_date dentro do MÊS selecionado)
  private static async calculateInstallmentsValue(metric: PaymentMetric, monthYear: string): Promise<{ total: number; details: string }> {
    try {
      // Buscar parcelas com due_date no MÊS selecionado
      const [yearStr, monthStr] = monthYear.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr) - 1
      const start = new Date(year, month, 1) // 1º do mês
      const end = new Date(year, month + 1, 0) // último dia do mês

      const { data: installments, error } = await this.supabase
        .from('payment_metric_details')
        .select('value, due_date, month_year, detail_type, installment_number')
        .eq('payment_metric_id', metric.id)
        .in('detail_type', ['installment', 'installment_amount'])
        .gte('due_date', start.toISOString().slice(0, 10))
        .lte('due_date', end.toISOString().slice(0, 10))

      if (error) {
        console.error('❌ Erro ao buscar parcelas:', error)
        return { total: 0, details: '' }
      }

      let rows = installments || []
      // Fallback: algumas linhas antigas podem não ter due_date, mas têm month_year
      if (rows.length === 0) {
        const { data: rowsByMonth } = await this.supabase
          .from('payment_metric_details')
          .select('value, due_date, month_year, detail_type, installment_number')
          .eq('payment_metric_id', metric.id)
          .in('detail_type', ['installment', 'installment_amount'])
          .eq('month_year', monthYear)
        rows = rowsByMonth || []
      }

      // Somar em reais a partir de 'value' (NUMERIC)
      const totalAmount = rows.reduce((sum: number, i: any) => {
        const v = i?.value !== undefined && i?.value !== null ? parseFloat(String(i.value)) : NaN
        return Number.isFinite(v) ? sum + v : sum
      }, 0)

      const count = rows.length || 0
      // Obter total de parcelas cadastradas para a métrica
      const { data: totalRows } = await this.supabase
        .from('payment_metric_details')
        .select('installment_number')
        .eq('payment_metric_id', metric.id)
        .in('detail_type', ['installment', 'installment_amount'])
      const totalInstallments = (totalRows || []).length

      let details = `${count} parcela${count !== 1 ? 's' : ''} do mês`
      if (count === 1 && totalInstallments > 0) {
        const num = rows[0]?.installment_number || 1
        details = `${num} de ${totalInstallments} Parcelado`
      }

      console.log(`📊 Parcelas (parcelado) para ${monthYear}:`, { totalAmount, count })
      return { total: totalAmount, details }
    } catch (error) {
      console.error('❌ Erro ao calcular parcelas:', error)
      return { total: 0, details: '' }
    }
  }

  // Calcular valor para parcelado (com due_date dentro do ANO selecionado)
  private static async calculateInstallmentsValueForYear(metric: PaymentMetric, year: string): Promise<{ total: number; details: string }> {
    try {
      // Buscar parcelas com due_date no ANO selecionado
      const yearNum = parseInt(year)
      const start = new Date(yearNum, 0, 1) // 1º de janeiro
      const end = new Date(yearNum, 11, 31) // 31 de dezembro

      const { data: installments, error } = await this.supabase
        .from('payment_metric_details')
        .select('value, due_date, month_year, detail_type, installment_number')
        .eq('payment_metric_id', metric.id)
        .in('detail_type', ['installment', 'installment_amount'])
        .gte('due_date', start.toISOString().slice(0, 10))
        .lte('due_date', end.toISOString().slice(0, 10))

      if (error) {
        console.error('❌ Erro ao buscar parcelas para ANO:', error)
        return { total: 0, details: '' }
      }

      let total = 0
      const installmentsList = installments || []
      
      for (const installment of installmentsList) {
        total += installment.value || 0
      }

      const details = `${installmentsList.length} parcelas no ano de ${year}`
      console.log(`📊 Parcelas para ANO ${year}: ${installmentsList.length} parcelas, total: ${total}`)
      
      return { total, details }
    } catch (error) {
      console.error('❌ Erro ao calcular parcelas para ANO:', error)
      return { total: 0, details: '' }
    }
  }

  // Calcular valor para parcelas fixas mensais para o ANO
  private static async calculateMonthlyFixedValueForYear(metric: PaymentMetric, year: string): Promise<number> {
    try {
      const yearNum = parseInt(year)
      const start = new Date(yearNum, 0, 1)
      const end = new Date(yearNum, 11, 31)
      
      // Verificar se a métrica intersecta o ano
      const metricStart = new Date(metric.start_date)
      const metricEnd = new Date(metric.end_date)
      
      if (metricEnd < start || metricStart > end) {
        return 0 // Métrica não intersecta o ano
      }
      
      // Calcular quantos meses da métrica estão dentro do ano
      const actualStart = metricStart > start ? metricStart : start
      const actualEnd = metricEnd < end ? metricEnd : end
      
      const monthsInYear = (actualEnd.getFullYear() - actualStart.getFullYear()) * 12 + 
                          (actualEnd.getMonth() - actualStart.getMonth()) + 1
      
      // Valor mensal * meses no ano
      const monthlyValue = metric.total_value / this.getMonthsDiffInclusive(metric.start_date, metric.end_date)
      const yearlyValue = Math.round(monthlyValue * monthsInYear)
      
      return yearlyValue
    } catch (error) {
      console.error('❌ Erro ao calcular parcelas mensais para ANO:', error)
      return 0
    }
  }

  // Calcular valor para percentual por fases para o ANO
  private static async calculatePercentagePhasesWithDetailsForYear(metric: PaymentMetric, year: string): Promise<Array<{
    expectedValue: number
    percentage: number
    projectName: string
    projectStatus: string
  }>> {
    try {
      console.log(`📊 Calculando percentual por fases para ANO ${year} - Empresa: ${metric.company_id}`)
      
      // Buscar projetos da empresa (sem filtro de mês, pois é anual)
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('id, name, budget, status, created_at, updated_at, end_date')
        .eq('company_id', metric.company_id)
        .in('status', ['planning', 'in_progress', 'development', 'testing', 'homologation', 'completed'])

      if (error) {
        console.error('❌ Erro ao buscar projetos para ANO:', error)
        return []
      }

      console.log(`📊 Projetos encontrados para ANO ${year}:`, projects?.length || 0)
      console.log(`📊 DEBUG: Lista de projetos:`, projects?.map(p => ({ name: p.name, budget: p.budget, end_date: p.end_date, status: p.status })))

      const projectDetails: Array<{
        expectedValue: number
        percentage: number
        projectName: string
        projectStatus: string
      }> = []

      // Processar cada projeto
      for (const project of projects || []) {
        const budget = project.budget || 0
        
        // Verificar se o projeto termina no ano atual
        if (project.end_date) {
          const projectEndYear = new Date(project.end_date).getFullYear().toString()
          if (projectEndYear !== year) {
            console.log(`📊 Projeto ${project.name}: Termina em ${projectEndYear}, não incluindo no ano ${year}`)
            continue
          }
        }
        
        // Para "Faturamento Total do Ano", sempre usar 100% do orçamento
        const totalPercentage = 100

        if (budget > 0) {
          // budget está em reais; para "Faturamento Total do Ano" usar o valor direto
          const expectedValue = Math.round(budget) // budget já está em reais
          projectDetails.push({
            projectName: project.name,
            projectStatus: project.status,
            percentage: totalPercentage,
            expectedValue
          })
          
          console.log(`📊 Projeto ${project.name}: Orçamento=${budget}, Data Término=${project.end_date}, Valor Total=${expectedValue}`)
        }
      }

      console.log(`📊 Total de projetos com percentual para ANO ${year}:`, projectDetails.length)
      return projectDetails
    } catch (error) {
      console.error('❌ Erro ao calcular percentual por fases para ANO:', error)
      return []
    }
  }
}