import { createClient } from '@supabase/supabase-js'
import { HourPackage, HourConsumption, CompanyHourStats } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class HourService {
  /**
   * Buscar dados de pacote de horas de uma empresa (da tabela companies)
   */
  static async getCompanyHourData(companyId: string): Promise<{
    contracted_hours: number
    package_start_date: string
    package_end_date: string | null
    package_type: string
    account_model: string
    has_hour_package: boolean
  } | null> {
    try {
      console.log(`🔍 Buscando dados de pacote da empresa: ${companyId}`)
      
      const { data, error } = await supabase
        .from('companies')
        .select('contracted_hours, package_start_date, package_end_date, package_type, account_model, has_hour_package')
        .eq('id', companyId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar dados da empresa:', error)
        return null
      }

      console.log(`✅ Dados da empresa encontrados:`, data)
      console.log(`📊 has_hour_package:`, data?.has_hour_package)
      console.log(`📊 contracted_hours:`, data?.contracted_hours)
      console.log(`📊 package_type:`, data?.package_type)
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error)
      return null
    }
  }

  /**
   * Verificar se um período está dentro do contrato da empresa
   */
  static async isPeriodWithinContract(companyId: string, monthYear?: string): Promise<boolean> {
    try {
      if (!monthYear) return true
      
      console.log("🔍 Verificando período do contrato para:", monthYear)
      
      const companyData = await this.getCompanyHourData(companyId)
      if (!companyData || !companyData.has_hour_package) {
        console.log("❌ Empresa não tem pacote configurado")
        return false
      }
      
      const [year, month] = monthYear.split('-')
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      
      const startDate = new Date(companyData.package_start_date)
      const endDate = companyData.package_end_date ? new Date(companyData.package_end_date) : null
      
      console.log("📅 Datas de comparação:", {
        selectedDate: selectedDate.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString() || 'null',
        packageType: companyData.package_type
      })
      
      const isAfterStart = selectedDate >= startDate
      const isBeforeEnd = endDate ? selectedDate <= endDate : true
      
      console.log("✅ Comparações:", {
        isAfterStart,
        isBeforeEnd,
        result: isAfterStart && isBeforeEnd
      })
      
      return isAfterStart && isBeforeEnd
    } catch (error) {
      console.error('❌ Erro ao verificar período do contrato:', error)
      return false
    }
  }

  /**
   * Buscar estatísticas consolidadas de horas para o dashboard
   */
  static async getDashboardHourStats(
    companyId?: string,
    month?: string,
    year?: string
  ): Promise<{
    totalContractedHours: number
    totalConsumedHours: number
    totalRemainingHours: number
    companiesWithPackages: number
  }> {
    try {
      console.log("🔍 getDashboardHourStats chamado com:", { companyId, month, year })
      
      if (companyId) {
        // Empresa específica selecionada
        console.log("🏢 Calculando para empresa específica:", companyId)
        
        const companyData = await this.getCompanyHourData(companyId)
        console.log("🔍 Dados da empresa retornados:", companyData)
        
        if (!companyData) {
          console.log("⚠️ Nenhum dado da empresa encontrado")
          return {
            totalContractedHours: 0,
            totalConsumedHours: 0,
            totalRemainingHours: 0,
            companiesWithPackages: 0
          }
        }
        
        // Se empresa não tem pacote de horas, buscar horas dos projetos
        if (!companyData.has_hour_package) {
          console.log("🚨 NOVA LÓGICA ATIVADA: Empresa não tem pacote de horas - buscando horas dos projetos")
          console.log("🔍 Company ID:", companyId)
          
          // Buscar TODOS os projetos da empresa primeiro (para debug)
          const { data: allProjects, error: allProjectsError } = await supabase
            .from('projects')
            .select('id, estimated_hours, status, name')
            .eq('company_id', companyId)

          console.log("🔍 TODOS os projetos da empresa:", allProjects)
          console.log("❌ Erro ao buscar todos os projetos:", allProjectsError)
          
          // Buscar projetos da empresa com horas estimadas
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, estimated_hours, status, name')
            .eq('company_id', companyId)
            .not('estimated_hours', 'is', null)

          console.log("🔍 Projetos com horas estimadas:", projects)
          console.log("❌ Erro ao buscar projetos com horas:", projectsError)

          if (projectsError) {
            console.error('❌ Erro ao buscar projetos da empresa:', projectsError)
            return {
              totalContractedHours: 0,
              totalConsumedHours: 0,
              totalRemainingHours: 0,
              companiesWithPackages: 0
            }
          }

          const projectHours = projects?.reduce((sum, p) => sum + (p.estimated_hours || 0), 0) || 0
          console.log("📊 Horas dos projetos da empresa:", projectHours)
          console.log("📊 Detalhes dos projetos:", projects?.map(p => ({ name: p.name, estimated_hours: p.estimated_hours })))

          const consumedHours = await this.calculateAutomaticHourConsumption(companyId, month && year ? `${year}-${month.padStart(2, '0')}` : undefined)
          const remainingHours = Math.max(0, projectHours - consumedHours)

          console.log("📊 Resultado final para empresa sem pacote:", {
            totalContractedHours: projectHours,
            totalConsumedHours: consumedHours,
            totalRemainingHours: remainingHours
          })

          return {
            totalContractedHours: projectHours,
            totalConsumedHours: consumedHours,
            totalRemainingHours: remainingHours,
            companiesWithPackages: 0
          }
        }

        // Verificar se o período está dentro do contrato
        if (month && year) {
          const monthYear = `${year}-${month.padStart(2, '0')}`
          console.log("🔍 Verificando período:", monthYear)
          
          const isWithinContract = await this.isPeriodWithinContract(companyId, monthYear)
          console.log("✅ Período está dentro do contrato:", isWithinContract)
          
          if (!isWithinContract) {
            console.log("⚠️ Período fora do contrato - retornando zeros")
            return {
              totalContractedHours: 0,
              totalConsumedHours: 0,
              totalRemainingHours: 0,
              companiesWithPackages: 1
            }
          }
        }

        const contractedHours = companyData.contracted_hours || 0
        console.log("📊 Horas contratadas:", contractedHours)
        
        const consumedHours = await this.calculateAutomaticHourConsumption(companyId, month && year ? `${year}-${month.padStart(2, '0')}` : undefined)
        console.log("📊 Horas consumidas calculadas:", consumedHours)
        
        const remainingHours = Math.max(0, contractedHours - consumedHours)
        console.log("📊 Horas restantes calculadas:", remainingHours)

        console.log("📊 Valores calculados:", {
          contractedHours,
          consumedHours,
          remainingHours
        })

        return {
          totalContractedHours: contractedHours,
          totalConsumedHours: consumedHours,
          totalRemainingHours: remainingHours,
          companiesWithPackages: 1
        }
      } else {
        // Todas as empresas
        console.log("🏢 Calculando para todas as empresas")
        
        // 1. Buscar horas dos pacotes de horas (empresas com has_hour_package = true)
        const { data: companies, error } = await supabase
          .from('companies')
          .select('id, contracted_hours, has_hour_package')
          .eq('has_hour_package', true)

        if (error) {
          console.error('❌ Erro ao buscar empresas:', error)
          return {
            totalContractedHours: 0,
            totalConsumedHours: 0,
            totalRemainingHours: 0,
            companiesWithPackages: 0
          }
        }

        const packageHours = companies?.reduce((sum, c) => sum + (c.contracted_hours || 0), 0) || 0
        const companiesWithPackages = companies?.length || 0

        // 2. Buscar empresas que NÃO possuem pacote de horas
        const { data: companiesWithoutPackage, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .eq('has_hour_package', false)

        console.log("🏢 Empresas sem pacote:", companiesWithoutPackage)
        console.log("❌ Erro na busca de empresas sem pacote:", companiesError)

        let projectHours = 0
        if (!companiesError && companiesWithoutPackage && companiesWithoutPackage.length > 0) {
          // 3. Buscar projetos dessas empresas
          const companyIds = companiesWithoutPackage.map(c => c.id)
          const { data: projectsWithoutPackage, error: projectsError } = await supabase
            .from('projects')
            .select('id, estimated_hours, status, company_id')
            .in('company_id', companyIds)
            .not('estimated_hours', 'is', null)

          console.log("🔍 Projetos sem pacote encontrados:", projectsWithoutPackage)
          console.log("❌ Erro na busca de projetos sem pacote:", projectsError)

          if (!projectsError && projectsWithoutPackage) {
            projectHours = projectsWithoutPackage.reduce((sum, p) => sum + (p.estimated_hours || 0), 0)
            console.log("📊 Horas dos projetos sem pacote:", projectHours)
          }
        }

        console.log("📊 Resumo do cálculo:", {
          packageHours,
          projectHours,
          totalContracted: packageHours + projectHours,
          companiesWithPackages,
          companiesWithoutPackage: companiesWithoutPackage?.length || 0
        })

        // 3. Calcular horas consumidas para todas as empresas
        let totalConsumed = 0
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('id, estimated_hours, status, company_id')

        if (!allProjectsError && allProjects) {
          for (const project of allProjects) {
            let consumedHours = 0
            const estimatedHours = project.estimated_hours || 0

            // Nova regra: Planejamento e Cancelado = 0%, todos os outros = 100%
            if (project.status === 'planning' || project.status === 'canceled' || project.status === 'cancelled') {
              consumedHours = 0 // 0%
            } else {
              consumedHours = estimatedHours // 100%
            }

            totalConsumed += consumedHours
          }
        }

        const totalContracted = packageHours + projectHours
        const totalRemaining = Math.max(0, totalContracted - totalConsumed)

        return {
          totalContractedHours: totalContracted,
          totalConsumedHours: totalConsumed,
          totalRemainingHours: totalRemaining,
          companiesWithPackages
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do dashboard:', error)
      return {
        totalContractedHours: 0,
        totalConsumedHours: 0,
        totalRemainingHours: 0,
        companiesWithPackages: 0
      }
    }
  }

  /**
   * Calcular horas consumidas automaticamente baseado nos projetos
   */
  static async calculateAutomaticHourConsumption(companyId: string, monthYear?: string): Promise<number> {
    try {
      console.log(`🔍 Calculando consumo automático para empresa: ${companyId}`)
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, estimated_hours, status')
        .eq('company_id', companyId)

      if (error) {
        console.warn('❌ Erro ao buscar projetos:', error.message)
        return 0
      }

      console.log(`📊 Projetos encontrados:`, projects?.length || 0)
      console.log(`📊 Detalhes dos projetos:`, projects)

      let totalConsumedHours = 0

      for (const project of projects || []) {
        let consumedHours = 0
        const estimatedHours = project.estimated_hours || 0

        console.log(`📋 Projeto ${project.id}:`, {
          status: project.status,
          estimatedHours,
          projectId: project.id
        })

        // Nova regra: Planejamento e Cancelado = 0%, todos os outros = 100%
        console.log(`🔍 Status do projeto ${project.id}: "${project.status}"`)
        
        if (project.status === 'planning' || project.status === 'canceled' || project.status === 'cancelled') {
          consumedHours = 0 // 0%
          console.log(`📋 Projeto ${project.id}: ${estimatedHours}h × 0% = ${consumedHours}h (${project.status})`)
        } else {
          consumedHours = estimatedHours // 100%
          console.log(`✅ Projeto ${project.id}: ${estimatedHours}h × 100% = ${consumedHours}h (${project.status})`)
        }

        totalConsumedHours += consumedHours
        console.log(`📈 Total acumulado: ${totalConsumedHours}h`)
      }

      console.log(`🎯 Total consumido: ${totalConsumedHours}h`)
      return totalConsumedHours
    } catch (error) {
      console.warn('Erro ao calcular consumo automático:', error)
      return 0
    }
  }

  /**
   * Obter horas consumidas (combinando registros manuais + cálculo automático)
   */
  static async getTotalHourConsumption(companyId: string, monthYear?: string): Promise<number> {
    try {
      console.log(`🔍 getTotalHourConsumption para empresa: ${companyId}`)
      
      // Por enquanto, usar apenas cálculo automático
      // A tabela hour_consumption será usada para registros manuais futuros
      const automaticHours = await this.calculateAutomaticHourConsumption(companyId, monthYear)
      
      console.log(`📊 Total de horas consumidas: ${automaticHours}h`)
      return automaticHours
    } catch (error) {
      console.error('Erro ao calcular total de horas consumidas:', error)
      return 0
    }
  }
} 