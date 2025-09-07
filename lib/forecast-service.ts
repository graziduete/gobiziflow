import { createClient } from '@/lib/supabase/client'
import { ProjectForecast, MonthlyForecast } from '@/lib/types'

export class ForecastService {
  private static supabase = createClient()

  /**
   * Calcula o percentual de previsão baseado no status do projeto
   */
  static getForecastPercentage(status: string): number {
    switch (status) {
      case 'planning':
        return 20 // 20% para projetos em planejamento
      case 'homologation':
        return 30 // 30% para projetos em homologação
      case 'completed':
        return 50 // 50% para projetos concluídos
      default:
        return 0 // outros status não geram previsão
    }
  }

  /**
   * Cria ou atualiza previsão para um projeto em um mês específico
   */
  static async createOrUpdateForecast(
    projectId: string,
    monthYear: string,
    status: string,
    budget: number,
    companyId: string
  ): Promise<ProjectForecast | null> {
    try {
      const percentage = this.getForecastPercentage(status)
      
      if (percentage === 0) {
        // Se o status não gera previsão, remove previsão existente se houver
        await this.supabase
          .from('project_forecasts')
          .delete()
          .eq('project_id', projectId)
          .eq('month_year', monthYear)
        return null
      }

      const forecastAmount = (budget * percentage) / 100

      // Verificar se já existe previsão para este projeto neste mês
      const { data: existingForecast } = await this.supabase
        .from('project_forecasts')
        .select('*')
        .eq('project_id', projectId)
        .eq('month_year', monthYear)
        .single()

      if (existingForecast) {
        // Atualizar previsão existente
        const { data, error } = await this.supabase
          .from('project_forecasts')
          .update({
            forecast_amount: forecastAmount,
            forecast_percentage: percentage,
            status_when_forecasted: status,
            budget_amount: budget,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingForecast.id)
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao atualizar previsão:', error)
          return null
        }

        return data
      } else {
        // Criar nova previsão
        const { data, error } = await this.supabase
          .from('project_forecasts')
          .insert({
            project_id: projectId,
            month_year: monthYear,
            forecast_amount: forecastAmount,
            forecast_percentage: percentage,
            status_when_forecasted: status,
            budget_amount: budget,
            company_id: companyId
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao criar previsão:', error)
          return null
        }

        return data
      }
    } catch (error) {
      console.error('❌ Erro no ForecastService:', error)
      return null
    }
  }

  /**
   * Busca previsões para um mês específico, opcionalmente filtrado por empresa
   */
  static async getMonthlyForecast(
    monthYear: string,
    companyId?: string
  ): Promise<MonthlyForecast | null> {
    try {
      let query = this.supabase
        .from('project_forecasts')
        .select(`
          *,
          projects:project_id(name, status),
          companies:company_id(name)
        `)
        .eq('month_year', monthYear)

      if (companyId && companyId !== 'all') {
        query = query.eq('company_id', companyId)
      }

      const { data: forecasts, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar previsões:', error)
        return null
      }

      // Calcular total e enriquecer dados
      const enrichedForecasts = (forecasts || []).map(forecast => ({
        ...forecast,
        project_name: forecast.projects?.name || 'Projeto não encontrado',
        company_name: forecast.companies?.name || 'Empresa não encontrada',
        current_status: forecast.projects?.status || 'Status desconhecido'
      }))

      const totalForecast = enrichedForecasts.reduce((sum, f) => sum + f.forecast_amount, 0)

      return {
        month_year: monthYear,
        total_forecast: totalForecast,
        forecasts: enrichedForecasts,
        company_filter: companyId
      }
    } catch (error) {
      console.error('❌ Erro ao buscar previsão mensal:', error)
      return null
    }
  }

  /**
   * Busca todas as previsões de um projeto
   */
  static async getProjectForecasts(projectId: string): Promise<ProjectForecast[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_forecasts')
        .select('*')
        .eq('project_id', projectId)
        .order('month_year', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar previsões do projeto:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar previsões do projeto:', error)
      return []
    }
  }

  /**
   * Remove previsões de um projeto (quando projeto é deletado)
   */
  static async deleteProjectForecasts(projectId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_forecasts')
        .delete()
        .eq('project_id', projectId)

      if (error) {
        console.error('❌ Erro ao deletar previsões do projeto:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao deletar previsões do projeto:', error)
      return false
    }
  }

  /**
   * Sincroniza previsões para todos os projetos ativos
   */
  static async syncAllProjectForecasts(monthYear: string): Promise<void> {
    try {
      console.log('🔄 Sincronizando previsões para:', monthYear)

      // Buscar todos os projetos ativos
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('id, status, budget, company_id')
        .not('status', 'eq', 'cancelled')

      if (error) {
        console.error('❌ Erro ao buscar projetos:', error)
        return
      }

      // Criar/atualizar previsões para cada projeto
      for (const project of projects || []) {
        if (project.budget && project.budget > 0) {
          await this.createOrUpdateForecast(
            project.id,
            monthYear,
            project.status,
            project.budget,
            project.company_id
          )
        }
      }

      console.log('✅ Previsões sincronizadas com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao sincronizar previsões:', error)
    }
  }
} 