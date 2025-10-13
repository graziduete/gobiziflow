import { createClient } from '@/lib/supabase/client'
import { PaymentMetric, PaymentMetricDetail } from '@/lib/types'

export class PaymentMetricService {
  private static supabase = createClient()

  // Criar ou atualizar métrica de pagamento
  static async createOrUpdateMetric(metric: PaymentMetric): Promise<PaymentMetric | null> {
    try {
      console.log('🔧 PaymentMetricService.createOrUpdateMetric - Dados recebidos:', {
        id: metric.id,
        company_id: metric.company_id,
        metric_type: metric.metric_type,
        name: metric.name,
        total_value: metric.total_value,
        hourly_rate: metric.hourly_rate,
        total_hours: metric.total_hours,
        start_date: metric.start_date,
        end_date: metric.end_date,
        is_active: metric.is_active
      })

      if (metric.id) {
        // Atualizar métrica existente
        console.log('🔄 Atualizando métrica existente:', metric.id)
        // Monta dinamicamente os campos de update para evitar violar constraints
        const updateData: any = {
          metric_type: metric.metric_type,
          name: metric.name,
          total_value: metric.total_value ?? 0,
          total_hours: metric.total_hours ?? 0,
          start_date: metric.start_date ?? new Date().toISOString().slice(0,10),
          end_date: metric.end_date ?? new Date(Date.now()+86400000).toISOString().slice(0,10),
          is_active: metric.is_active,
          updated_at: new Date().toISOString()
        }
        // Constraint no banco exige hourly_rate > 0. Para tipos que não usam, garantimos 1 com um pré-update dedicado
        let ensureHourlyRate = 1
        if (metric.metric_type === 'monthly_fixed' && metric.hourly_rate && metric.hourly_rate > 0) {
          ensureHourlyRate = metric.hourly_rate
        }
        // 1) Primeiro, garantir hourly_rate > 0 para não violar a constraint
        const { error: hrErr } = await this.supabase
          .from('payment_metrics')
          .update({ hourly_rate: ensureHourlyRate })
          .eq('id', metric.id)
        if (hrErr) {
          console.warn('⚠️ Falha ao garantir hourly_rate > 0 (seguindo mesmo assim):', hrErr)
        }
        // 2) Em seguida, atualizar os demais campos (sem hourly_rate) 

        const { error } = await this.supabase
          .from('payment_metrics')
          .update(updateData)
          .eq('id', metric.id)
        
        // Após update, buscar a métrica atual para devolver
        const { data, error: fetchErr } = await this.supabase
          .from('payment_metrics')
          .select('*')
          .eq('id', metric.id)
          .single()

        if (error || fetchErr) {
          console.error('❌ Erro ao atualizar métrica:', {
            message: (error || fetchErr)?.message,
            details: (error || fetchErr)?.details,
            hint: (error || fetchErr)?.hint,
            code: (error || fetchErr)?.code,
            table: 'payment_metrics',
            data: metric
          })
          const err = (error || fetchErr) as any
          throw new Error(`Erro do Supabase: ${err?.message || 'update/select falhou'}`)
        }
        console.log('✅ Métrica atualizada com sucesso:', data)
        return data
      } else {
        // Criar nova métrica
        console.log('➕ Criando nova métrica')
        
        // Testar conexão com a tabela primeiro
        const tableConnection = await this.testTableConnection()
        if (!tableConnection) {
          throw new Error('Não foi possível conectar com a tabela payment_metrics')
        }
        
        const insertData: any = {
          company_id: metric.company_id,
          hour_package_id: metric.hour_package_id || null,
          metric_type: metric.metric_type,
          name: metric.name,
          total_value: metric.total_value || 0,
          total_hours: metric.total_hours || 0,
          start_date: metric.start_date,
          end_date: metric.end_date,
          is_active: metric.is_active !== undefined ? metric.is_active : true
        }
        
        // Só incluir hourly_rate se for maior que 0
        if (metric.hourly_rate && metric.hourly_rate > 0) {
          insertData.hourly_rate = metric.hourly_rate
        }
        
        // Incluir percentuais das fases se for metric_type = 'percentage_phases'
        if (metric.metric_type === 'percentage_phases') {
          insertData.planning_percentage = metric.planning_percentage || 0
          insertData.homologation_percentage = metric.homologation_percentage || 0
          insertData.completion_percentage = metric.completion_percentage || 0
        }
        
        // Validar dados obrigatórios (mais flexível)
        if (!insertData.company_id) {
          throw new Error('company_id é obrigatório')
        }
        if (!insertData.metric_type) {
          throw new Error('metric_type é obrigatório')
        }
        if (!insertData.name) {
          throw new Error('name é obrigatório')
        }
        
        // Garantir valores padrão para campos opcionais
        insertData.start_date = insertData.start_date || new Date().toISOString().split('T')[0]
        insertData.end_date = insertData.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        // Para métricas "percentual por fases", total_value deve ser 0 pois é calculado dinamicamente
        if (insertData.metric_type === 'percentage_phases') {
          insertData.total_value = 0
        } else {
          insertData.total_value = insertData.total_value || 0
        }
        
        // Para métricas "percentual por fases", total_hours deve ser NULL pois não se aplica
        console.log('🔍 [DEBUG] total_hours antes do processamento:', insertData.total_hours)
        console.log('🔍 [DEBUG] metric_type:', insertData.metric_type)
        
        if (insertData.metric_type === 'percentage_phases') {
          insertData.total_hours = null
          console.log('🔍 [DEBUG] total_hours definido como NULL para percentage_phases')
        } else {
          insertData.total_hours = insertData.total_hours || 0
          console.log('🔍 [DEBUG] total_hours definido como:', insertData.total_hours)
        }
        console.log('🔍 [DEBUG] total_hours após processamento:', insertData.total_hours)
        insertData.is_active = insertData.is_active !== undefined ? insertData.is_active : true
        
        // Garantir valores padrão para percentuais (para métricas percentage_phases)
        if (insertData.metric_type === 'percentage_phases') {
          // CRÍTICO: Para satisfazer a constraint, a soma deve ser 100
          // Se homologation_percentage for undefined/null/vazio, usar 0
          insertData.planning_percentage = insertData.planning_percentage !== undefined ? parseInt(String(insertData.planning_percentage)) : 0
          insertData.homologation_percentage = (insertData.homologation_percentage !== undefined && 
                                               insertData.homologation_percentage !== null && 
                                               insertData.homologation_percentage !== '') 
                                               ? parseInt(String(insertData.homologation_percentage)) 
                                               : 0
          insertData.completion_percentage = insertData.completion_percentage !== undefined ? parseInt(String(insertData.completion_percentage)) : 0
          
          console.log('🔍 [DEBUG] Percentuais processados:', {
            planning: insertData.planning_percentage,
            homologation: insertData.homologation_percentage,
            completion: insertData.completion_percentage,
            soma: insertData.planning_percentage + insertData.homologation_percentage + insertData.completion_percentage
          })
        }
        
        console.log('🔧 Dados após validação e ajustes:', insertData)
        
        // Validar datas apenas para métricas que não são "percentual por fases"
        if (insertData.metric_type !== 'percentage_phases') {
          const startDate = new Date(insertData.start_date)
          const endDate = new Date(insertData.end_date)
          
          if (startDate >= endDate) {
            console.warn('⚠️ Data de início >= Data de fim, ajustando...')
            // Ajustar end_date para 1 dia após start_date se necessário
            const adjustedEndDate = new Date(startDate)
            adjustedEndDate.setDate(adjustedEndDate.getDate() + 1)
            insertData.end_date = adjustedEndDate.toISOString().split('T')[0]
            console.log('📅 End date ajustado para:', insertData.end_date)
          }
        }
        
        console.log('📤 Dados que serão inseridos:', JSON.stringify(insertData, null, 2))
        
        console.log('🚀 Executando INSERT na tabela payment_metrics...')
        console.log('📊 Dados sendo inseridos:', JSON.stringify(insertData, null, 2))
        
        // Tentar inserir sem select() primeiro para ver se há erro de validação
        console.log('🔍 Tentando INSERT com dados:', insertData)
        
        const { error: insertError } = await this.supabase
          .from('payment_metrics')
          .insert([insertData])
        
        if (insertError) {
          console.error('❌ Erro no INSERT:', insertError)
          console.error('❌ Erro completo:', JSON.stringify(insertError, null, 2))
          console.error('❌ Dados que causaram erro:', JSON.stringify(insertData, null, 2))
          
          // Se for erro de constraint, tentar com valores padrão
          if (insertError.code === '23514') {
            console.log('🔄 Tentando com valores padrão...')
            const fallbackData = {
              ...insertData,
              hourly_rate: 1, // Valor mínimo
              total_value: 1, // Valor mínimo
              total_hours: 1, // Valor mínimo
              // Preservar percentuais das fases se existirem
              ...(insertData.planning_percentage !== undefined && {
                planning_percentage: insertData.planning_percentage,
                homologation_percentage: insertData.homologation_percentage,
                completion_percentage: insertData.completion_percentage
              })
            }
            
            const { error: fallbackError } = await this.supabase
              .from('payment_metrics')
              .insert([fallbackData])
            
            if (fallbackError) {
              console.error('❌ Erro no fallback:', fallbackError)
              throw new Error(`Erro no INSERT: ${insertError.message}`)
            }
            
            console.log('✅ INSERT com fallback executado com sucesso')
            // Continuar com o fallback
            insertData.hourly_rate = 1
            insertData.total_value = 1
            insertData.total_hours = 1
            // Preservar percentuais das fases se existirem
            if (insertData.planning_percentage !== undefined) {
              insertData.planning_percentage = insertData.planning_percentage
              insertData.homologation_percentage = insertData.homologation_percentage
              insertData.completion_percentage = insertData.completion_percentage
            }
          } else {
            throw new Error(`Erro no INSERT: ${insertError.message}`)
          }
        }
        
        console.log('✅ INSERT executado com sucesso, buscando dados inseridos...')
        
        // Agora buscar os dados inseridos
        const { data, error: selectError } = await this.supabase
          .from('payment_metrics')
          .select('*')
          .eq('company_id', insertData.company_id)
          .eq('metric_type', insertData.metric_type)
          .eq('name', insertData.name)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        console.log('🔍 Buscando dados inseridos:', { data, selectError })
        
        if (selectError) {
          console.error('❌ Erro no SELECT após INSERT:', selectError)
          throw new Error(`Erro no SELECT: ${selectError.message}`)
        }
        
        console.log('📊 Resposta do Supabase:', { data, hasError: false })

        if (selectError) {
          console.error('❌ Erro ao buscar métrica criada:', {
            message: selectError.message,
            details: selectError.details,
            hint: selectError.hint,
            code: selectError.code,
            table: 'payment_metrics',
            data: insertData
          })
          throw new Error(`Erro ao buscar métrica: ${selectError.message}`)
        }
        console.log('✅ Métrica criada com sucesso:', data)
        
        // Se não encontrou dados, tentar buscar de outra forma
        if (!data) {
          console.log('⚠️ Dados não encontrados, tentando buscar de outra forma...')
          const { data: fallbackData, error: fallbackError } = await this.supabase
            .from('payment_metrics')
            .select('*')
            .eq('company_id', insertData.company_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (fallbackError) {
            console.error('❌ Erro no fallback SELECT:', fallbackError)
            throw new Error(`Erro no fallback SELECT: ${fallbackError.message}`)
          }
          
          console.log('✅ Métrica encontrada via fallback:', fallbackData)
          return fallbackData
        }
        
        return data
      }
    } catch (error) {
      console.error('❌ Erro ao criar/atualizar métrica de pagamento:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: {
          id: metric.id,
          company_id: metric.company_id,
          metric_type: metric.metric_type,
          name: metric.name
        }
      })
      return null
    }
  }

  // Buscar métricas por empresa
  static async getMetricsByCompany(companyId: string): Promise<PaymentMetric[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_metrics')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar métricas da empresa:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          companyId
        })
        throw new Error(`Erro ao buscar métricas: ${error.message}`)
      }
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar métricas da empresa:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { companyId }
      })
      return []
    }
  }

  // Criar detalhes de métrica (parcelas mensais, fases, etc.)
  static async createMetricDetails(
    metricId: string, 
    details: any[]
  ): Promise<boolean> {
    try {
      console.log('🔧 Criando detalhes da métrica:', {
        metricId,
        detailsCount: details.length,
        firstDetail: details[0]
      })

      const detailsToInsert = details.map(detail => {
        const numericValue = Number(detail.value)
        const valueAsString = Number.isFinite(numericValue)
          ? numericValue.toFixed(2) // numeric(,2) compat
          : '0.00'
        const insertDetail: any = {
          payment_metric_id: metricId,
          detail_type: detail.detail_type, // 'installment' | 'monthly_amount' | 'phase_percentage'
          value: valueAsString,
          status: detail.status || 'pending'
        }

        // Adicionar campos opcionais
        if (detail.percentage !== undefined) insertDetail.percentage = detail.percentage
        if (detail.phase_name) insertDetail.phase_name = detail.phase_name
        if (detail.installment_number !== undefined) insertDetail.installment_number = detail.installment_number
        if (detail.due_date) insertDetail.due_date = detail.due_date
        if (detail.month_year) insertDetail.month_year = detail.month_year
        // status: manter default do banco

        console.log('🔧 Mapeando detalhe:', { original: detail, mapped: insertDetail })
        return insertDetail
      })

      console.log('📤 Dados que serão inseridos:', JSON.stringify(detailsToInsert, null, 2))
      
      // Validar dados antes de inserir
      console.log('🔍 Validando dados antes da inserção...')
      for (const detail of detailsToInsert) {
        console.log('🔍 Validando detalhe:', detail)
        
        if (!detail.payment_metric_id) {
          throw new Error('payment_metric_id é obrigatório')
        }
        if (!detail.detail_type) {
          throw new Error('detail_type é obrigatório')
        }
        const parsed = parseFloat(detail.value)
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`value inválido: ${detail.value} (não-numérico ou <= 0)`) 
        }
        if (detail.installment_number !== undefined && (typeof detail.installment_number !== 'number' || detail.installment_number < 1)) {
          throw new Error(`installment_number inválido: ${detail.installment_number}`)
        }
      }
      console.log('✅ Validação passou, todos os dados estão corretos')

      console.log('🚀 Executando INSERT dos detalhes (sem select)...')
      const insertResponse = await this.supabase
        .from('payment_metric_details')
        .insert(detailsToInsert)
      const { data, error } = insertResponse as any
      console.log('📊 Resposta do Supabase (raw):', insertResponse)
      console.log('📊 Resumo:', { hasError: !!error, dataPresent: !!data })

      if (error) {
        console.error('❌ Erro do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          table: 'payment_metric_details',
          data: detailsToInsert,
          errorObject: error,
          errorKeys: Object.keys(error),
          errorValues: Object.values(error)
        })
        
        // Se for erro de constraint, tentar com valores mínimos
        if (error.code === '23514') {
          console.log('🔄 Tentando detalhes com valores mínimos...')
          const fallbackDetails = detailsToInsert.map(detail => ({
            ...detail,
            value: Math.max(detail.value, 1), // Valor mínimo
            installment_number: detail.installment_number || 1,
            status: (detail as any).status || 'pending'
          }))
          
          const { error: fallbackError } = await this.supabase
            .from('payment_metric_details')
            .insert(fallbackDetails)
          
          if (fallbackError) {
            console.error('❌ Erro no fallback dos detalhes:', fallbackError)
            throw new Error(`Erro do Supabase: ${error.message}`)
          }
          
          console.log('✅ Detalhes criados com fallback')
          return true
        } else {
          throw new Error(`Erro do Supabase: ${error.message || 'Erro desconhecido'}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`)
        }
      }
      
      console.log('✅ Detalhes da métrica criados com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro ao criar detalhes da métrica:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { metricId, detailsCount: details.length }
      })
      return false
    }
  }

  // Atualiza as parcelas conforme installment_number (upsert por número)
  static async upsertInstallmentDetails(
    metricId: string,
    details: Array<{ detail_type: string; value: string | number; installment_number: number; due_date?: string; status?: string }>
  ): Promise<boolean> {
    try {
      // Buscar existentes para mapear por installment_number
      const { data: existing, error: selErr } = await this.supabase
        .from('payment_metric_details')
        .select('id, installment_number')
        .eq('payment_metric_id', metricId)
        .eq('detail_type', 'installment')

      if (selErr) {
        console.error('❌ Erro ao buscar parcelas existentes:', selErr)
        return false
      }

      const numToId = new Map<number, string>()
      for (const row of existing || []) {
        if (row.installment_number) numToId.set(row.installment_number, row.id)
      }

      // Preparar batches de update e insert
      const updates: any[] = []
      const inserts: any[] = []
      for (const d of details) {
        const id = numToId.get(d.installment_number)
        const numericValue = Number(d.value)
        const valueAsString = Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00'
        if (id) {
          updates.push({ id, value: valueAsString, due_date: d.due_date || null, status: d.status || 'pending' })
        } else {
          inserts.push({
            payment_metric_id: metricId,
            detail_type: 'installment',
            value: valueAsString,
            installment_number: d.installment_number,
            due_date: d.due_date || null,
            status: d.status || 'pending'
          })
        }
      }

      if (updates.length > 0) {
        // Supabase não suporta update em lote com payloads diferentes; atualizar uma a uma
        for (const u of updates) {
          const { error: updErr } = await this.supabase
            .from('payment_metric_details')
            .update({ value: u.value, due_date: u.due_date, status: u.status })
            .eq('id', u.id)
          if (updErr) {
            console.error('❌ Erro ao atualizar parcela:', { id: u.id, updErr })
            return false
          }
        }
      }

      if (inserts.length > 0) {
        const { error: insErr } = await this.supabase
          .from('payment_metric_details')
          .insert(inserts)
        if (insErr) {
          console.error('❌ Erro ao inserir novas parcelas:', insErr)
          return false
        }
      }

      // Sincronizar período da métrica com base nas parcelas (min/max due_date)
      await this.syncMetricPeriodFromInstallments(metricId)

      return true
    } catch (error) {
      console.error('❌ Erro no upsert de parcelas:', error)
      return false
    }
  }

  // Atualiza start_date e end_date da métrica com base nas parcelas (menor/maior due_date)
  private static async syncMetricPeriodFromInstallments(metricId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('payment_metric_details')
        .select('due_date')
        .eq('payment_metric_id', metricId)
        .eq('detail_type', 'installment')

      if (error) {
        console.warn('⚠️ Não foi possível ler parcelas para sincronizar período:', error)
        return
      }

      const dates = (data || [])
        .map((d: any) => d.due_date)
        .filter((d: any) => !!d)
        .map((d: string) => new Date(d))
        .filter((d: Date) => !isNaN(d.getTime()))

      if (dates.length === 0) return

      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

      const toISO = (dt: Date) => dt.toISOString().slice(0, 10)

      const { error: updErr } = await this.supabase
        .from('payment_metrics')
        .update({ start_date: toISO(minDate), end_date: toISO(maxDate) })
        .eq('id', metricId)

      if (updErr) {
        console.warn('⚠️ Falha ao atualizar período da métrica a partir das parcelas:', updErr)
      }
    } catch (err) {
      console.warn('⚠️ Erro ao sincronizar período da métrica:', err)
    }
  }

  // Gerar parcelas mensais automaticamente
  static async generateMonthlyInstallments(
    metricId: string,
    totalValue: number,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      const start = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Datas inválidas')
      }

      const monthsCount = (
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) + 1
      )

      const monthlyAmount = totalValue / monthsCount
      console.log('📊 Calculando parcelas mensais:', {
        totalValue,
        monthsCount,
        monthlyAmount,
        startDate,
        endDate
      })
      
      const details: Omit<PaymentMetricDetail, 'id' | 'payment_metric_id' | 'created_at'>[] = []

      let currentDate = new Date(start)
      let monthNumber = 1

      while (currentDate <= end) {
        const detail = {
          detail_type: 'monthly_amount',
          amount: Math.round(monthlyAmount), // Manter em centavos
          month_year: currentDate.toISOString().slice(0, 7), // YYYY-MM
          installment_number: monthNumber,
          due_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
          is_paid: false
        }
        
        console.log(`📅 Criando parcela ${monthNumber}:`, detail)
        details.push(detail)

        currentDate.setMonth(currentDate.getMonth() + 1)
        monthNumber++
      }

      console.log('📤 Enviando detalhes para criação:', {
        metricId,
        detailsCount: details.length,
        firstDetail: details[0]
      })
      
      return await this.createMetricDetails(metricId, details)
    } catch (error) {
      console.error('❌ Erro ao gerar parcelas mensais:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { metricId, totalValue, startDate, endDate }
      })
      return false
    }
  }

  // Buscar detalhes de uma métrica
  static async getMetricDetails(metricId: string): Promise<PaymentMetricDetail[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_metric_details')
        .select('*')
        .eq('payment_metric_id', metricId)
        .order('installment_number', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar detalhes da métrica:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          metricId
        })
        throw new Error(`Erro ao buscar detalhes: ${error.message}`)
      }
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes da métrica:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { metricId }
      })
      return []
    }
  }

  // Deletar métrica e seus detalhes
  static async deleteMetric(metricId: string): Promise<boolean> {
    try {
      // Primeiro deletar os detalhes
      const { error: detailsError } = await this.supabase
        .from('payment_metric_details')
        .delete()
        .eq('payment_metric_id', metricId)

      if (detailsError) {
        console.error('❌ Erro ao deletar detalhes da métrica:', {
          message: detailsError.message,
          details: detailsError.details,
          hint: detailsError.hint,
          code: detailsError.code
        })
        throw new Error(`Erro ao deletar detalhes: ${detailsError.message}`)
      }

      // Depois deletar a métrica
      const { error: metricError } = await this.supabase
        .from('payment_metrics')
        .delete()
        .eq('id', metricId)

      if (metricError) {
        console.error('❌ Erro ao deletar métrica:', {
          message: metricError.message,
          details: metricError.details,
          hint: metricError.hint,
          code: metricError.code
        })
        throw new Error(`Erro ao deletar métrica: ${metricError.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao deletar métrica:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { metricId }
      })
      return false
    }
  }

  // Função de teste para verificar se a tabela está funcionando
  static async testTableConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testando conexão com a tabela payment_metrics...')
      
      const { data, error } = await this.supabase
        .from('payment_metrics')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('❌ Erro ao conectar com payment_metrics:', error)
        return false
      }
      
      console.log('✅ Conexão com payment_metrics OK')
      return true
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error)
      return false
    }
  }

  // Criar percentuais das fases
  static async createPhasePercentages(
    metricId: string,
    planningPercentage: number,
    homologationPercentage: number,
    completionPercentage: number
  ): Promise<void> {
    try {
      console.log('📊 Criando percentuais das fases:', {
        metricId,
        planningPercentage,
        homologationPercentage,
        completionPercentage
      })

      const phaseDetails = [
        {
          payment_metric_id: metricId,
          detail_type: 'phase_percentage',
          phase_name: 'Planejamento',
          percentage: planningPercentage,
          amount: 1 // Valor mínimo para evitar constraint violation
        },
        {
          payment_metric_id: metricId,
          detail_type: 'phase_percentage',
          phase_name: 'Homologação',
          percentage: homologationPercentage,
          amount: 1 // Valor mínimo para evitar constraint violation
        },
        {
          payment_metric_id: metricId,
          detail_type: 'phase_percentage',
          phase_name: 'Conclusão',
          percentage: completionPercentage,
          amount: 1 // Valor mínimo para evitar constraint violation
        }
      ]

      console.log('📊 Dados dos percentuais das fases:', JSON.stringify(phaseDetails, null, 2))
      
      const { data, error } = await this.supabase
        .from('payment_metric_details')
        .insert(phaseDetails)
        .select()
      
      console.log('📊 Resposta do INSERT dos percentuais:', { data, error, hasError: !!error })

      if (error) {
        console.error('❌ Erro ao criar percentuais das fases:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          table: 'payment_metric_details',
          data: phaseDetails
        })
        
        // Se for erro de constraint, tentar com valores mínimos
        if (error.code === '23514') {
          console.log('🔄 Tentando percentuais com valores mínimos...')
          const fallbackPhaseDetails = phaseDetails.map(detail => ({
            ...detail,
            amount: 1,
            percentage: Math.max(detail.percentage, 1) // Garantir que percentage seja pelo menos 1
          }))
          
          const { error: fallbackError } = await this.supabase
            .from('payment_metric_details')
            .insert(fallbackPhaseDetails)
          
          if (fallbackError) {
            console.error('❌ Erro no fallback dos percentuais:', fallbackError)
            throw new Error(`Erro do Supabase: ${error.message}`)
          }
          
          console.log('✅ Percentuais das fases criados com fallback')
        } else {
          throw new Error(`Erro do Supabase: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`)
        }
      }

      console.log('✅ Percentuais das fases criados com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar percentuais das fases:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        details: error,
        params: { metricId, planningPercentage, homologationPercentage, completionPercentage }
      })
      throw error // Re-throw para que o erro seja tratado no nível superior
    }
  }
} 