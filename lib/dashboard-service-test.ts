import { createClient } from '@/lib/supabase/client'
import { PaymentMetric } from '@/lib/types'

export class DashboardServiceTest {
  private static supabase = createClient()

  // TESTE SIMPLIFICADO - Calcular valor previsto para um mês específico
  static async getExpectedValueForMonth(monthYear: string): Promise<{
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
      console.log('🚀 TESTE SIMPLIFICADO - Calculando valor previsto para:', monthYear)
      
      // BUSCAR APENAS métricas mensais/parceladas (EXCLUINDO percentage_phases)
      const { data: metrics, error: metricsError } = await this.supabase
        .from('payment_metrics')
        .select(`
          *,
          companies!inner (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .neq('metric_type', 'percentage_phases')

      if (metricsError) {
        console.error('❌ Erro ao buscar métricas:', metricsError)
        return { totalExpected: 0, breakdown: [] }
      }

      console.log('🚀 TESTE - Métricas encontradas:', metrics?.length || 0)
      
      if (!metrics || metrics.length === 0) {
        console.log('🚀 TESTE - Nenhuma métrica encontrada')
        return { totalExpected: 0, breakdown: [] }
      }

      let totalExpected = 0
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

      // FILTRO SIMPLES: Verificar se o mês/ano está dentro do período
      console.log('🚀 TESTE - monthYear recebido:', monthYear)
      
      // CORREÇÃO: Extrair ano e mês diretamente da string
      const [year, month] = monthYear.split('-')
      const targetYear = parseInt(year)
      const targetMonth = parseInt(month)
      
      console.log('🚀 TESTE - targetYear e targetMonth calculados:', { targetYear, targetMonth })
      
      // PROCESSAR todas as métricas e filtrar durante o processamento
      console.log('🚀 TESTE - Iniciando processamento de', metrics.length, 'métricas')
      for (const metric of metrics) {
        console.log('🚀 TESTE - PROCESSANDO MÉTRICA:', {
          id: metric.id,
          company: (metric.companies as any)?.name,
          start_date: metric.start_date,
          end_date: metric.end_date
        })
        
        const startDate = new Date(metric.start_date)
        const endDate = new Date(metric.end_date)
        
        // FILTRO SIMPLES: Verificar se o mês selecionado está dentro do período
        const startYear = startDate.getFullYear()
        const startMonth = startDate.getMonth() + 1
        const endYear = endDate.getFullYear()
        const endMonth = endDate.getMonth() + 1
        
        // FILTRO DEFINITIVO: Verificar se o mês/ano está dentro do período
        console.log('🚀 TESTE - Verificando período:', {
          company: (metric.companies as any)?.name,
          start_date: metric.start_date,
          end_date: metric.end_date,
          startYear, startMonth, endYear, endMonth,
          targetYear, targetMonth
        })
        
        // FILTRO SIMPLES E DIRETO: Se o ano final é menor que o ano selecionado, FILTRAR FORA
        console.log('🚀 TESTE - ANTES DO FILTRO:', { endYear, targetYear, isEndYearLess: endYear < targetYear })
        if (endYear < targetYear) {
          console.log('🚀 TESTE - FILTRADA: Ano final menor', { endYear, targetYear })
          continue
        }
        
        // FILTRO SIMPLES E DIRETO: Se o ano final é igual mas o mês final é menor, FILTRAR FORA
        if (endYear === targetYear && endMonth < targetMonth) {
          console.log('🚀 TESTE - FILTRADA: Mês final menor', { endYear, endMonth, targetYear, targetMonth })
          continue
        }
        
        console.log('🚀 TESTE - MÉTRICA VÁLIDA: Dentro do período')
        const companyName = (metric.companies as any)?.name || 'Empresa Desconhecida'
        
        console.log('🚀 TESTE - Processando métrica:', {
          id: metric.id,
          type: metric.metric_type,
          total_value: metric.total_value,
          start_date: metric.start_date,
          end_date: metric.end_date,
          company: companyName
        })

        // Calcular valor mensal para cada métrica
        // CORREÇÃO: Cálculo correto de meses (usando as variáveis já declaradas)
        // startYear, startMonth, endYear, endMonth já foram declarados acima
        
        // Calcular diferença em meses
        let monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth)
        
        // Se o dia do final é maior ou igual ao dia do início, adiciona 1
        if (endDate.getDate() >= startDate.getDate()) {
          monthsDiff += 1
        }
        
        const monthlyValue = Math.round(metric.total_value / monthsDiff)
        
        // CALCULAR qual parcela está sendo paga no mês selecionado
        const targetDate = new Date(`${monthYear}-01`)
        
        // Calcular diferença em meses entre início e mês selecionado
        const monthsFromStart = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                               (targetDate.getMonth() - startDate.getMonth()) + 1
        
        // Garantir que a parcela está dentro do período
        const currentParcel = Math.min(Math.max(monthsFromStart, 1), monthsDiff)
        
        console.log('🚀 TESTE - Cálculo inteligente:', {
          company: companyName,
          total_value: metric.total_value,
          months_diff: monthsDiff,
          monthly_value: monthlyValue,
          start_date: metric.start_date,
          target_period: monthYear,
          months_from_start: monthsFromStart,
          current_parcel: currentParcel
        })

        // Somar ao total (monthlyValue está em centavos)
        totalExpected += monthlyValue
        
        // Adicionar ao breakdown com parcela inteligente
        breakdown.push({
          companyId: metric.company_id,
          companyName,
          metricType: `${currentParcel} de ${monthsDiff} Parcelas Mensais`,
          expectedValue: monthlyValue,
          details: `${monthsDiff} meses`,
          projectName: undefined,
          projectStatus: undefined,
          percentage: undefined
        })
      }

      // PROCESSAR MÉTRICAS PERCENTUAL POR FASES (ADICIONAL)
      console.log('🚀 TESTE - Iniciando processamento de métricas Percentual por Fases')
      
      // Buscar métricas do tipo percentage_phases
      const { data: percentageMetrics, error: percentageError } = await this.supabase
        .from('payment_metrics')
        .select(`
          *,
          companies!inner (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .eq('metric_type', 'percentage_phases')

      if (percentageError) {
        console.error('❌ Erro ao buscar métricas percentuais:', percentageError)
      } else if (percentageMetrics && percentageMetrics.length > 0) {
        console.log('🚀 TESTE - Métricas percentuais encontradas:', percentageMetrics.length)
        
        for (const metric of percentageMetrics) {
          const companyName = (metric.companies as any)?.name || 'Empresa Desconhecida'
          
          console.log('🚀 TESTE - Processando métrica percentual:', {
            company: companyName,
            company_id: metric.company_id,
            planning_percentage: metric.planning_percentage,
            homologation_percentage: metric.homologation_percentage,
            completion_percentage: metric.completion_percentage
          })
          
          // Buscar projetos da empresa
          console.log('🚀 TESTE - Buscando projetos para company_id:', metric.company_id)
          const { data: projects, error: projectsError } = await this.supabase
            .from('projects')
            .select('*')
            .eq('company_id', metric.company_id)
          
          if (projectsError) {
            console.error('❌ Erro ao buscar projetos:', {
              error: projectsError,
              company_id: metric.company_id,
              company_name: companyName
            })
            continue
          }
          
          console.log('🚀 TESTE - Projetos encontrados para', companyName, ':', projects?.length || 0)
          
          if (!projects || projects.length === 0) {
            console.log('🚀 TESTE - Nenhum projeto ativo para', companyName)
            continue
          }
          
          // Processar cada projeto
          for (const project of projects) {
            console.log('🚀 TESTE - Processando projeto:', {
              id: project.id,
              name: project.name,
              status: project.status,
              budget: project.budget
            })
            
            // Verificar se o projeto tem orçamento
            if (!project.budget || project.budget <= 0) {
              console.log('🚀 TESTE - Projeto sem orçamento válido')
              continue
            }
            
            // FILTRO: Projetos "Percentual por Fases" aparecem no mês da última atualização (mudança de status)
            const projectUpdatedDate = new Date(project.updated_at)
            const projectUpdatedMonth = `${projectUpdatedDate.getFullYear()}-${String(projectUpdatedDate.getMonth() + 1).padStart(2, '0')}`
            
            console.log('🚀 TESTE - Verificando mês da última atualização:', {
              project_name: project.name,
              created_at: project.created_at,
              updated_at: project.updated_at,
              project_updated_month: projectUpdatedMonth,
              current_month: monthYear,
              status: project.status
            })
            
            if (projectUpdatedMonth !== monthYear) {
              console.log('🚀 TESTE - Projeto fora do mês de atualização, pulando:', {
                project_name: project.name,
                project_updated_month: projectUpdatedMonth,
                current_month: monthYear,
                status: project.status
              })
              continue
            }
            
            // Determinar percentual baseado no status
            let percentage = 0
            let phaseName = ''
            
            switch (project.status) {
              case 'planning':
                percentage = metric.planning_percentage || 0
                phaseName = 'Planejamento'
                break
              case 'homologation':
                percentage = metric.homologation_percentage || 0
                phaseName = 'Homologação'
                break
              case 'completed':
                percentage = metric.completion_percentage || 0
                phaseName = 'Concluído'
                break
              default:
                console.log('🚀 TESTE - Status de projeto não reconhecido:', project.status)
                continue
            }
            
            if (percentage <= 0) {
              console.log('🚀 TESTE - Percentual inválido para o status:', project.status, percentage)
              continue
            }
            
            // Calcular valor previsto (budget já está em reais)
            console.log('🚀 TESTE - DEBUG BUDGET:', {
              raw_budget: project.budget,
              budget_type: typeof project.budget,
              budget_string: String(project.budget)
            })
            
            const expectedValue = Math.round((project.budget * percentage) / 100)
            // Converter para centavos para manter consistência com métricas mensais
            const expectedValueInCents = expectedValue * 100
            
            console.log('🚀 TESTE - CÁLCULO DETALHADO:', {
              step1: `${project.budget} * ${percentage}`,
              step1_result: project.budget * percentage,
              step2: `${project.budget * percentage} / 100`,
              step2_result: (project.budget * percentage) / 100,
              final: `Math.round(${(project.budget * percentage) / 100})`,
              final_result: expectedValue
            })
            
            console.log('🚀 TESTE - Cálculo percentual por fases:', {
              project_name: project.name,
              project_status: project.status,
              phase_name: phaseName,
              budget_reais: project.budget,
              percentage: percentage,
              expected_value: expectedValue,
              calculation: `${project.budget} * ${percentage} / 100 = ${expectedValue}`
            })
            
            // Somar ao total (usando valor em centavos)
            console.log('🚀 TESTE - ANTES da soma:', { totalExpected, expectedValue, expectedValueInCents })
            totalExpected += expectedValueInCents
            console.log('🚀 TESTE - DEPOIS da soma:', { totalExpected })
            
            // Adicionar ao breakdown com formato específico
            breakdown.push({
              companyId: metric.company_id,
              companyName,
              metricType: `${percentage}% ${phaseName}`,
              expectedValue: expectedValueInCents,
              details: `Projeto ${project.name}`,
              projectName: project.name,
              projectStatus: project.status,
              percentage: percentage
            })
          }
        }
      } else {
        console.log('🚀 TESTE - Nenhuma métrica percentual encontrada')
      }

      console.log('🚀 TESTE - Loop finalizado. Processadas', metrics.length, 'métricas')
      console.log('🚀 TESTE - Total calculado:', totalExpected)
      console.log('🚀 TESTE - Breakdown length:', breakdown.length)
      console.log('🚀 TESTE - Breakdown:', breakdown)
      
      // LOG FINAL VISÍVEL
      console.log('🚨 RESULTADO FINAL:', {
        periodo_selecionado: monthYear,
        total_esperado: totalExpected,
        total_esperado_reais: `R$ ${(totalExpected / 100).toFixed(2).replace('.', ',')}`,
        empresas_processadas: breakdown.length,
        empresas: breakdown.map(b => b.companyName)
      })

      return {
        totalExpected,
        breakdown
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      return {
        totalExpected: 0,
        breakdown: []
      }
    }
  }
}